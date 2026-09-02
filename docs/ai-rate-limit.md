# AI rate limit

Svaki poziv Gemini AI funkcijama prolazi kroz zajednički rate limit. Zaštita važi za:

- AI chatbot
- generator opisa nekretnine
- automatski maintenance triage

## Kako radi

Pre poziva ka Gemini-ju, aplikacija uzima IP adresu zahteva, pretvara je u SHA-256 hash i atomarno povećava brojač u PostgreSQL tabeli `AiRateLimit`.

Brojač je zajednički za sve AI funkcije i čuva se u bazi, pa limit ostaje aktivan i nakon restarta aplikacije ili kada postoji više server instanci. Sirova IP adresa se ne upisuje u bazu.

Kada korisnik pređe limit, Gemini se ne poziva. Aplikacija vraća poruku sa brojem sekundi do sledećeg vremenskog prozora (`retryAfterSeconds`). Ako baza nije dostupna, AI poziv se takođe blokira, kako se ne bi napravili neograničeni troškovi.

## Podešavanje

U `.env` postavi sledeće promenljive:

```env
AI_RATE_LIMIT_MAX_REQUESTS="20"
AI_RATE_LIMIT_WINDOW_SECONDS="3600"
```

Ovaj primer dozvoljava ukupno 20 AI zahteva po IP adresi tokom jednog sata. Ako promenljive nisu postavljene, koriste se iste podrazumevane vrednosti.

## Baza i deploy

Tabela se kreira Prisma migracijom. Lokalno pokreni:

```bash
npx prisma migrate dev
```

Na produkciji pokreni:

```bash
npx prisma migrate deploy
```

## Napomena o bezbednosti

Limit je trenutno po IP adresi jer aplikacija još nema serverski verifikovanu sesiju. Kada se uvede autentifikacija preko HTTP-only session kolačića, preporuka je da se ključ limita promeni na ID prijavljenog korisnika (uz IP limit kao dodatni sloj).

`GEMINI_API_KEY` mora ostati samo u server-side environment varijablama i nikada ne sme imati prefiks `NEXT_PUBLIC_`.
