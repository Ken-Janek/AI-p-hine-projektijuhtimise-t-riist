# FlowPilot

AI-põhise projektijuhtimise tööriista töötav frontend-MVP.

## Käivitamine

Rakendus ei vaja ehitamist ega väliseid sõltuvusi. Ava `index.html` brauseris või käivita kaustas lihtne veebiserver:

```powershell
python -m http.server 8080
```

Seejärel ava <http://localhost:8080>.

## Funktsioonid

- ülesannete lisamine, muutmine, kustutamine ja lõpetamine;
- staatus, prioriteet, vastutaja, tähtaeg ja ülesannetevaheline sõltuvus;
- otsing ning staatuse ja prioriteedi filtrid;
- backlog'i Kanban-vaade ja blokeeringute visualiseerimine;
- reeglipõhised AI-soovitused tähtaegade, blokeeringute, prioriteetide ja koormuse põhjal;
- töölaua statistika, sprindi edenemine ja tegevuste ajalugu;
- CSV eksport, tume teema ja responsiivne kujundus;
- andmete salvestamine brauseri `localStorage`-isse.

## Tehniline märkus

MVP töötab täielikult brauseris. Reeglipõhine soovitusmootor ei vaja API-võtit. Tootelahenduses saab selle asendada serveripoolse LLM-integratsiooniga ning lisada päris autentimise ja andmebaasi.
