# FlowPilot

AI-põhise projektijuhtimise tööriista töötav frontend-MVP.

## Käivitamine Gemini AI-ga

1. Paigalda sõltuvused:

```powershell
npm install
```

2. Tee `.env.example` failist koopia nimega `.env`:

```powershell
Copy-Item .env.example .env
```

3. Loo Google AI Studios Gemini API võti, ava `.env` ja asenda näidisväärtus:

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.1-flash-lite
```

4. Käivita rakendus:

```powershell
npm start
```

5. Kohalikus arenduses ava <http://localhost:8080>; Railwayl kasuta teenuse genereeritud avalikku domeeni.

API-võti jääb ainult serverisse. `.env` on `.gitignore` failis ja seda ei lisata GitHubi. Kõik AI päringud käivad läbi serveri `/api/generate-mockup` endpointi. Mudelit saab muuta `GEMINI_MODEL` väärtusega; vaikimisi kasutatakse `gemini-3.1-flash-lite` mudelit Google Interactions API kaudu.

Kui API-võtit pole lisatud või AI teenus ei vasta, jätkab rakendus automaatselt sisseehitatud offline-mallidega. Ühenduse olek kuvatakse Mockup Studio ülaosas.

## Funktsioonid

- ülesannete lisamine, muutmine, kustutamine ja lõpetamine;
- staatus, prioriteet, vastutaja, tähtaeg ja ülesannetevaheline sõltuvus;
- otsing ning staatuse ja prioriteedi filtrid;
- backlog'i Kanban-vaade ja blokeeringute visualiseerimine;
- live-mockup'ide loomine backlog'i ülesandest või vabast prompt'ist;
- mockup'i iteratiivne täpsustamine, versioonide ajalugu ning desktopi, tahvli ja mobiili eelvaade;
- reeglipõhised AI-soovitused tähtaegade, blokeeringute, prioriteetide ja koormuse põhjal;
- töölaua statistika, sprindi edenemine ja tegevuste ajalugu;
- CSV eksport, tume teema ja responsiivne kujundus;
- ülesannete, tegevuste ja mockup'ide püsiv salvestamine serveri `data/app-data.json` faili;
- serveripoolne sisendite ja AI vastuse struktuuri valideerimine;
- AI HTML-i puhastamine ning skriptideta sandbox-eelvaade.

## Automaattest

Kui Edge on käivitatud CDP pordil `9222`, käivita täielik brauseri suitsutest. Railway domeeni testimiseks määra enne `APP_URL` keskkonnamuutuja.

```powershell
node tests/browser-smoke.mjs
```

## Railway

1. Impordi GitHubi repositoorium Railway projekti.
2. Lisa teenuse muutujad `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.1-flash-lite` ja `NODE_ENV=production`.
3. Ära määra `PORT` muutujat käsitsi; Railway lisab selle automaatselt.
4. Lisa teenusele volume mount-path'iga `/app/data`, et ülesanded ja mockup'id säiliksid deploy'de vahel.
5. Sea healthcheck path väärtuseks `/health` ja genereeri Settings → Networking alt avalik domeen.

Rakendus kasutab Railway lisatud `RAILWAY_VOLUME_MOUNT_PATH` muutujat automaatselt.

## Tehniline märkus

Projektihalduse soovitused on reeglipõhised. Mockup Studio kasutab seadistatud Gemini API-t ning kukub vajadusel tagasi offline-mallidele. Tootelahenduses tuleks lisada autentimine, mitme kasutaja andmebaas ja kasutajapõhine päringulimiit.
