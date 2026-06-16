import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";
// @ts-ignore
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as xlsx from "xlsx";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initialize data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ rooms: [], settings: { totalSiteRooms: null, uninspectedMode: 'unknown', enableGlobalEstimation: true } }));
}

function getData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      rooms: parsed.rooms || [],
      settings: parsed.settings || { totalSiteRooms: null, uninspectedMode: 'unknown', enableGlobalEstimation: true }
    };
  } catch (error) {
    console.error("Error reading data file:", error);
    return { rooms: [], settings: { totalSiteRooms: null, uninspectedMode: 'unknown', enableGlobalEstimation: true } };
  }
}

function saveData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing data file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
      return res.json({ username: 'admin', role: 'admin' });
    }
    if (username === 'viewer' && password === 'viewer123') {
      return res.json({ username: 'viewer', role: 'viewer' });
    }
    return res.status(401).json({ error: 'Identifiants invalides' });
  });

  app.get('/api/data', (req, res) => {
    res.json(getData());
  });

  app.post('/api/settings', (req, res) => {
    const { settings } = req.body;
    const data = getData();
    data.settings = { ...data.settings, ...settings };
    saveData(data);
    res.json(data.settings);
  });

  app.post('/api/rooms', (req, res) => {
    const { rooms } = req.body;
    if (!rooms || !Array.isArray(rooms)) {
      return res.status(400).json({ error: "Format invalide" });
    }
    
    // Merge analyzed dalux reports with existing ones based on Room Name to keep BIM data intact
    const data = getData();
    const existingRooms = data.rooms;
    rooms.forEach((daluxRoom: any) => {
      // Find matching BIM room
      const idx = existingRooms.findIndex(
        (r: any) => r.roomName.toLowerCase().trim() === daluxRoom.roomName.toLowerCase().trim()
      );
      if (idx >= 0) {
        // Update existing BIM building
        existingRooms[idx].status = daluxRoom.status;
        existingRooms[idx].progress = daluxRoom.progress;
        existingRooms[idx].missingWork = daluxRoom.missingWork;
      } else {
        // Create new ID
        daluxRoom.id = daluxRoom.roomName.trim().replace(/\\s+/g, '-').toLowerCase();
        existingRooms.push(daluxRoom);
      }
    });

    saveData(data);
    res.json(existingRooms);
  });

  app.post('/api/rooms/single', (req, res) => {
    const newRoom = req.body;
    if (!newRoom.id) {
       newRoom.id = `${newRoom.floor}-${newRoom.zone}-${newRoom.roomName}`.replace(/\s+/g, '-');
    }
    const data = getData();
    data.rooms.push(newRoom);
    saveData(data);
    res.json(data.rooms);
  });

  app.put('/api/rooms/:id', (req, res) => {
    const { id } = req.params;
    const updatedRoom = req.body;
    const data = getData();
    const existingRooms = data.rooms;
    const index = existingRooms.findIndex((r: any) => r.id === id);
    if (index >= 0) {
      existingRooms[index] = { ...existingRooms[index], ...updatedRoom };
      saveData(data);
      res.json(existingRooms[index]);
    } else {
      res.status(404).json({ error: 'Local non trouvé' });
    }
  });

  app.delete('/api/rooms/:id', (req, res) => {
    const { id } = req.params;
    const data = getData();
    data.rooms = data.rooms.filter((r: any) => r.id !== id);
    saveData(data);
    res.json({ success: true, rooms: data.rooms });
  });

  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/import-bim", upload.single("bimFile"), async (req, res) => {
    try {
      let fileText = "";
      if (req.file) {
        const { originalname, buffer, mimetype } = req.file;
        const oNameLower = originalname.toLowerCase();

        if (oNameLower.endsWith(".xlsx") || oNameLower.endsWith(".xls") || mimetype.includes("spreadsheetml") || mimetype.includes("excel") || oNameLower.endsWith(".csv")) {
          const workbook = xlsx.read(buffer, { type: "buffer" });
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            fileText += xlsx.utils.sheet_to_csv(sheet) + "\n";
          }
        } else {
          return res.status(400).json({ error: "Veuillez fournir un fichier Excel ou CSV pour les données BIM." });
        }
      } else {
         return res.status(400).json({ error: "Aucun fichier BIM fourni." });
      }

      if (!fileText || fileText.trim() === '') {
        return res.status(400).json({ error: "Le fichier BIM est vide." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Voici un export depuis la maquette BIM Revit (Dynamo) contenant la liste des locaux du projet.
        Extraire tous les locaux trouvés.
        
        Règles :
        1. Pour chaque ligne/entrée, extraire le Nom du local, l'Étage, et la Zone.
        2. Status = "Non inspecté"
        3. Progress = 0
        4. missingWork = []
        5. L'ID doit être généré à partir du nom du local.
        
        Texte à analyser :\n\n${fileText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rooms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    roomName: { type: Type.STRING },
                    floor: { type: Type.STRING },
                    zone: { type: Type.STRING },
                    status: { type: Type.STRING },
                    progress: { type: Type.NUMBER },
                    missingWork: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["id", "roomName", "floor", "zone", "status", "progress", "missingWork"]
                }
              }
            },
            required: ["rooms"]
          }
        }
      });

      const responseText = response.text;
      
      if (!responseText) {
          throw new Error("Empty response from Gemini.");
      }

      const json = JSON.parse(responseText.trim());
      
      // We merge or initialize the DB
      const data = getData();
      let existingRooms = data.rooms;
      
      json.rooms.forEach((newBimRoom: any) => {
         // Create a solid ID
         newBimRoom.id = newBimRoom.roomName.trim().replace(/\\s+/g, '-').toLowerCase();
         // Check if exists
         const idx = existingRooms.findIndex((r: any) => r.id === newBimRoom.id || r.roomName === newBimRoom.roomName);
         if (idx >= 0) {
            existingRooms[idx] = { ...existingRooms[idx], floor: newBimRoom.floor, zone: newBimRoom.zone };
         } else {
            existingRooms.push(newBimRoom);
         }
      });
      
      data.rooms = existingRooms;
      saveData(data);
      
      res.json({ rooms: existingRooms });

    } catch (error: any) {
      console.error("Error importing BIM data:", error);
      res.status(500).json({ error: error.message || "Failed to import BIM data" });
    }
  });

  app.post("/api/analyze-report", upload.single("reportFile"), async (req, res) => {
    try {
      let reportText = "";

      if (req.file) {
        const { originalname, buffer, mimetype } = req.file;
        const oNameLower = originalname.toLowerCase();

        if (oNameLower.endsWith(".pdf") || mimetype === "application/pdf") {
          const pdfData = await pdfParse(buffer);
          reportText = pdfData.text;
        } else if (oNameLower.endsWith(".docx") || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const result = await mammoth.extractRawText({ buffer });
          reportText = result.value;
        } else if (oNameLower.endsWith(".xlsx") || oNameLower.endsWith(".xls") || mimetype.includes("spreadsheetml") || mimetype.includes("excel")) {
          const workbook = xlsx.read(buffer, { type: "buffer" });
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            reportText += xlsx.utils.sheet_to_csv(sheet) + "\n";
          }
        } else if (oNameLower.endsWith(".txt") || mimetype === "text/plain") {
          reportText = buffer.toString("utf-8");
        } else {
          return res.status(400).json({ error: "Format de fichier non supporté. Veuillez utiliser PDF, DOCX, XLSX ou TXT." });
        }
      } else if (req.body.reportText) {
        reportText = req.body.reportText;
      } else {
        return res.status(400).json({ error: "Aucun fichier ou texte fourni." });
      }

      if (!reportText || reportText.trim() === '') {
        return res.status(400).json({ error: "Le document est vide ou n'a pas pu être lisible." });
      }

      // Get existing rooms to provide context to Gemini
      const existingRooms = getData().rooms.map((r: any) => ({ roomName: r.roomName, floor: r.floor, zone: r.zone }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Voici un export de remarques du logiciel Dalux pour le chantier du CHU Dakhla. 
        Analyse ce texte et identifie l'état d'avancement des locaux.
        Tu dois te baser sur les locaux existants si possible : ${JSON.stringify(existingRooms.slice(0, 50))} (liste partielle).
        
        Règles d'analyse strictes :
        1. Identifie tous les locaux mentionnés. 
        2. Pour chaque local, extrais son nom exact, son étage, et sa zone.
        3. Fais la correspondance exacte avec les noms de locaux (ex: "Chambre 101").
        4. CAS 1 : Si le message contient "Terminé", alors status = "Terminé", progress = 100, et missingWork = [].
        5. CAS 2 (Ailleurs non concerné, géré par le système par défaut = "Non inspecté").
        6. CAS 3 : Si le message contient "Manque...", "Non installé...", "Non terminé...", "En attente...", "À corriger...", alors status = "En cours" (ou "Bloqué" si explicite), et extrais précisément la liste des travaux restants dans "missingWork".
        
        Texte à analyser :\n\n${reportText}`,
        config: {
          systemInstruction: "Tu es un expert en analyse de rapports Dalux. Tu dois extraire un tableau structuré JSON correspondant aux locaux inspectés.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rooms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "Un ID unique basé sur le nom" },
                    roomName: { type: Type.STRING },
                    floor: { type: Type.STRING },
                    zone: { type: Type.STRING },
                    status: { type: Type.STRING, description: "Terminé, En cours, or Bloqué" },
                    progress: { type: Type.NUMBER, description: "0 to 100" },
                    missingWork: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["id", "roomName", "floor", "zone", "status", "progress", "missingWork"]
                }
              }
            },
            required: ["rooms"]
          }
        }
      });

      const responseText = response.text;
      
      if (!responseText) {
          throw new Error("Empty response from Gemini.");
      }

      const json = JSON.parse(responseText.trim());
      res.json(json);

    } catch (error: any) {
      console.error("Error analyzing report:", error);
      res.status(500).json({ error: error.message || "Failed to analyze report" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
