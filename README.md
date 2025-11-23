# immobilIAre.it

Un'applicazione web moderna per la ricerca e la visualizzazione di immobili, potenziata dall'Intelligenza Artificiale.

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere installato sul tuo computer:

- **Python** (versione 3.10 o superiore)
- **Node.js** (versione 18 o superiore)
- **Git**

Avrai inoltre bisogno delle chiavi API per i seguenti servizi:
- OpenAI
- Google (per funzionalità aggiuntive)
- Supabase (Database)

## 🚀 Installazione

### 1. Clona il repository

```bash
git clone https://github.com/FilCor/immobilIAre.it.git
cd immobilIAre.it
```

### 2. Configurazione Backend

Il backend è scritto in Python. È consigliato utilizzare un ambiente virtuale.

```bash
# Crea l'ambiente virtuale
python -m venv backend/venv

# Attiva l'ambiente virtuale
# Su macOS/Linux:
source backend/venv/bin/activate
# Su Windows:
# backend\venv\Scripts\activate

# Installa le dipendenze
pip install -r backend/requirements.txt
```

### 3. Configurazione Frontend

Il frontend è un'applicazione Next.js.

```bash
cd frontend
npm install
cd ..
```

## ⚙️ Configurazione Variabili d'Ambiente

Il progetto richiede diverse variabili d'ambiente per funzionare.

1.  Copia il file di esempio `secret.env.example` in un nuovo file chiamato `secret.env` nella root del progetto.
2.  Apri `secret.env` e inserisci le tue chiavi API:

```env
# Backend & AI Logic
OPENAI_API_KEY=tua_chiave_openai
GOOGLE_API_KEY=tua_chiave_google

# Database & Auth
SUPABASE_URL=tua_url_supabase
SUPABASE_KEY=tua_chiave_supabase
DATABASE_URL=tua_url_database_postgres

```

> **Nota:** Il file `secret.env` è ignorato da git per sicurezza. Non committarlo mai.

## ▶️ Avvio

Per avviare l'applicazione, dovrai eseguire sia il backend che il frontend in due terminali separati.

### Terminale 1: Backend

```bash
# Assicurati di essere nella root del progetto e di avere il venv attivo
source backend/venv/bin/activate
python backend/main.py
```
Il backend sarà attivo (di default su `http://localhost:8000` o simile, controlla l'output).

### Terminale 2: Frontend

```bash
cd frontend
npm run dev
```
Il frontend sarà accessibile a `http://localhost:3000`.

## 🛠️ Struttura del Progetto

- `/backend`: Contiene la logica Python, API e script di gestione dati.
- `/frontend`: Applicazione Next.js per l'interfaccia utente.
- `secret.env`: File di configurazione (non versionato).
