# FlowPilot

AI-põhise projektijuhtimise tööriista töötav frontend-MVP.

## Käivitamine päris AI-ga

1. Paigalda sõltuvused:

```powershell
npm install
```

2. Tee `.env.example` failist koopia nimega `.env`:

```powershell
Copy-Item .env.example .env
```

3. Ava `.env` ja asenda näidisväärtus enda OpenAI API võtmega:

```text
OPENAI_API_KEY=sk-...
```

4. Käivita rakendus:

```powershell
npm start
```

5. Ava <http://localhost:8080> ja vali külgmenüüst **Mockupid**.

API-võti jääb ainult serverisse. `.env` on `.gitignore` failis ja seda ei lisata GitHubi. Mudelit saab muuta `OPENAI_MODEL` väärtusega; vaikimisi kasutatakse `gpt-5.4-mini` mudelit.

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
- andmete salvestamine brauseri `localStorage`-isse.

## Automaattest

Kui Edge on käivitatud CDP pordil `9222` ja rakendus töötab pordil `8080`, käivita täielik brauseri suitsutest:

```powershell
node tests/browser-smoke.mjs
```

## Tehniline märkus

Projektihalduse soovitused on reeglipõhised. Mockup Studio kasutab seadistatud OpenAI Responses API-t ning kukub vajadusel tagasi offline-mallidele. Tootelahenduses tuleks lisada päris autentimine, andmebaas, kasutajapõhine päringulimiit ja põhjalikum genereeritud HTML-i puhastamine.
