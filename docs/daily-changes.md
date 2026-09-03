# Daily Changes

**Datum:** 2. septembar 2026. **Vreme:** 23:20 (CEST)

Ovaj dokument sumira sve izmene urađene tokom jedne radne sesije: kompletan audit aplikacije, sanacija kritičnih bezbednosnih propusta, popravka lokalnog razvojnog okruženja, ubrzanje upita, i dovršavanje više funkcija koje su izgledale gotove ali nikad nisu bile povezane sa bazom.

---

## 1. Audit aplikacije

Sproveden je pregled cele aplikacije kroz tri paralelne analize (bezbednost/API sloj, backend/podaci/AI, frontend/UI/i18n), uz ručnu verifikaciju najkritičnijih nalaza čitanjem izvornog koda. Rezultat je pisani izveštaj i PDF sa prioritizovanom listom problema, poslat korisniku pre početka sanacije.

---

## 2. Podešavanje lokalnog razvojnog okruženja

- Otkriveno da `.env` fajl nikad nije postojao (samo `.env.example`), pa ništa što dodiruje bazu nije moglo da radi.
- Pronađen postojeći PostgreSQL 17 (EDB instalacija), servis nije bio pokrenut — pokrenut uz pomoć korisnika (sudo lozinka).
- Kroz pgAdmin napravljena posebna baza (`mini_property`) i poseban korisnik za aplikaciju.
- Napravljen `.env` fajl, primenjeno svih 9 postojećih Prisma migracija, pokrenuta seed skripta.
- Otkrivena i ispravljena neusklađenost: `NEXT_PUBLIC_DEMO_TENANT_ID` u `.env.example` je bio nepostojeći placeholder umesto pravog ID-ja generisanog pri seed-ovanju.
- Ispravljen bag zbog kog je početna stranica (`/`) trajno visila na "Loading..." — funkcija koja proverava sesiju (`hydrate()`) pozivana je samo unutar dashboard layout-a, nikad na root stranici.

---

## 3. Kritični bezbednosni propusti (sanacija)

- **Zaobilaženje autorizacije preko `x-tenant-id` header-a** — najveći broj API ruta (nekretnine, zahtevi za održavanje, radnici, admini, pretraga) verovalo je klijentskom header-u umesto sesiji. Sve prebačeno na pravu sesijsku proveru (`getSessionUser()`); pomoćna funkcija `requireTenantId` koja je to omogućavala je obrisana.
- **`/api/debug` i srodne rute** — vraćale su kompletnu bazu (uključujući tokene za pozivnice) bez ikakve autentikacije. Obrisane u potpunosti (`/api/debug`, `/api/debug/notifications`, `/api/test-notifications`, `/api/notifications/test`) jer nisu bile deo stvarne funkcionalnosti.
- **SSRF i curenje tajnog ključa u webhook-ovima** — dodata provera (`src/lib/url-safety.ts`) koja odbija privatne/interne IP adrese (uključujući cloud metadata endpoint) i pri kreiranju webhook-a i pri svakom slanju. `GET /api/webhooks` više ne vraća tajni potpisni ključ.
- **Upload fajlova** — zahteva sada prijavu i admin/owner ulogu; ime fajla se generiše na serveru umesto da se koristi klijentsko ime (zatvoren path traversal); tip fajla se proverava kroz listu dozvoljenih ekstenzija.
- **Autentikacija samo na klijentu** — dashboard rute sada proveravaju sesiju na serveru pre renderovanja i preusmeravaju na login; uklonjen test-bypass koji je ostavljao stranicu za održavanje potpuno otvorenom bez sesije.
- **Autorizacija po ulozi** — kreiranje/brisanje admina, radnika i stanara, kao i izmena/brisanje nekretnina, sada zahteva admin/owner ulogu. Radnici vide i menjaju samo zahteve za održavanje koji su njima dodeljeni.
- **Curenje `passwordHash`-a** — pronađeno i ispravljeno na tri mesta (lista stanara, search API, izmena radnika) gde je API vraćao heširanu lozinku u odgovoru.
- **Logovanje registracionih tokena** — `src/lib/email.ts` je ispisivao pun registracioni link (sa tokenom) u server log pri svakom slanju pozivnice; uklonjeno.

---

## 4. Popravka pokvarenih endpoint-a

- `PUT /api/profile` — bacao je grešku (`ReferenceError`) zbog nepostojeće promenljive; svaki pokušaj izmene profila je padao. Popravljeno, dodato i čisto rukovanje duplim email-om.
- `DELETE /api/tenants` — pozivao je funkciju koja nije bila uvezena u fajl; uvek je vraćao 500. Popravljeno.
- Prevod navigacije (sidebar, desktop i mobilni) — ključevi za pretragu rečnika nikad nisu odgovarali stvarnim ključevima, pa se prevod tiho nikad nije primenjivao. Izdvojena zajednička konfiguracija navigacije (`src/config/nav.ts`) sa eksplicitnim ključevima; potvrđeno uživo da nemački prevod sada radi.
- Sidebar je bio `position: fixed` bez kompenzacije razmaka, pa je preklapao levih 80px svake stranice. Ispravljeno dodavanjem odgovarajućeg razmaka; potvrđeno screenshot-om.

---

## 5. Ubrzanje upita i performanse

- Dashboard je server-side pravio HTTP pozive ka sopstvenom API-ju (dupli mrežni round-trip po zahtevu). Prebačen da direktno čita iz baze preko zajedničkog sloja upita (`src/server/queries.ts`) — vreme odgovora palo sa ~300ms na ~56ms kad je "zagrejan".
- Dodati indeksi na `tenantId` kolone (i kombinovani indeksi za filtriranje po ulozi/dodeljenom radniku) kroz novu Prisma migraciju, za sve multi-tenant tabele.
- Objašnjeno i demonstrirano da je deo percipirane sporosti bio normalan Turbopack dev-mode overhead (izmereno: iste rute u produkcijskom buildu ~30-60x brže).

---

## 6. Model podataka

- **`User.role`** prebačen sa slobodnog stringa na pravi Postgres enum (`admin`, `owner`, `worker`, `tenant`) — baza sada sama odbija nevalidne vrednosti.
- **`WorkLog`** — nov model; radni dnevnici na zahtevima za održavanje su ranije živeli samo u memoriji servera i gubili se pri svakom restartu. Sada su trajno sačuvani u bazi.
- **`Document`** — nov model; funkcija za dokumente je bila potpuna klijentska simulacija (lokalni state, bez ikakvog API poziva). Sada je u potpunosti povezana: upload na disk + zapis u bazi, listanje, brisanje (i sa diska i iz baze).

---

## 7. Bezbednosni HTTP header-i i CSP

- Dodati `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` na sve rute.
- Dodat pun `Content-Security-Policy` header, testiran headless browserom na 20+ stranica aplikacije (svi dashboard delovi, AI generator/chatbot, podešavanja, registracija, reset lozinke...). Pronađen i ispravljen jedan stvaran propust u listi (avatari sa `i.pravatar.cc` nisu bili dozvoljeni).

---

## 8. Rate-limiting

- Login, forgot-password i reset-password sada koriste isti atomični Postgres mehanizam kao postojeći AI rate-limit (`src/lib/rate-limit.ts`), sa odvojenim ograničenjem po IP adresi i po nalogu.
- Testirano uživo: posle 10 pogrešnih pokušaja prijave na isti nalog, 11. pokušaj vraća 429, dok drugi nalozi sa iste IP adrese ostaju neometani.

---

## 9. Zod validacija

Dodata na rute koje je nisu imale: kreiranje/izmena nekretnina (validacija tipa nekretnine), kreiranje/izmena zahteva za održavanje (validacija statusa/prioriteta, provera da dodeljeni radnik i nekretnina pripadaju istoj firmi), pozivnice za stanare/radnike/admine (pravi format email adrese), izmena stanara/radnika, slanje poruke stanaru.

---

## 10. Otkrivene i popravljene "lažne" funkcije

Prilikom pregleda preostalih formi otkriveno je da nekoliko dijaloga izgleda funkcionalno, ali nikad nije bilo povezano sa serverom (samo su lokalno menjali prikaz, bez trajnog čuvanja):

- **Izmena stanara** — uređivala je polja koja ne postoje u bazi (telefon, kirija, datum isteka zakupa, status) i nikad nije zvala API. Napravljena prava `PUT /api/tenants/[id]` ruta; dijalog svela na stvarna polja (ime, email, nekretnina). Status "New"/"Active" se sada računa iz stvarnog signala (da li je stanar dovršio registraciju) umesto da uvek prikazuje "New".
- **Izmena radnika** — isti problem (telefon, status, dodela na više nekretnina — što trenutna šema ni ne podržava). Svedeno na ime/email, koji se stvarno čuvaju.
- **Slanje poruke stanaru** — dijalog je uvek prikazivao "Poruka poslata!" bez ikakvog stvarnog slanja (samo `console.log`). Napravljena prava email ruta preko postojeće Resend/SMTP infrastrukture.
- **Izmena nekretnine** — slala je izmišljena polja (cena, sobe, kupatila) koja server tiho ignoriše; usklađena sa stvarnom šemom, dodato polje za grad koje je nedostajalo.
- **Kreiranje zahteva za održavanje (admin/radnik varijanta)** — sadržala je hardkodovan lažni `x-user-email` header i hardkodovane ID-jeve iz sasvim drugog seed-a (ostaci iz ranije faze razvoja). Radnik je trebalo da bude automatski dodeljen sebi, ali kod to nikad nije radio uprkos poruci u interfejsu koja je to obećavala — ispravljeno.
- Usput: `propertyId` se uopšte nije vraćao sa `/api/auth/me` (bio je neophodan za gornju popravku); `UserRole` tip na frontendu nije uključivao `'owner'` iako postoji u bazi.

---

## 11. Forme — react-hook-form + zod

Dijalozi za dodavanje/izmenu stanara, radnika, admina i nekretnina prepravljeni sa ručnog `useState` upravljanja na `react-hook-form` + `zod` — uklonjena je, između ostalog, bag-ovita promenljiva `emailError` koja se koristila za sve vrste grešaka. Dodate jasne poruke greške po polju. Testirano uživo kroz headless browser (prazan submit → greške; validan unos → uspeh).

Registraciona forma (`/register`) je dobila zaštitu od duplog slanja i uklonjeni su ostavljeni debug ispisi.

---

## 12. Test infrastruktura

Postavljen `vitest` (`npm test` / `npm run test:watch`) — projekat do sada nije imao nijedan test. Napisano 18 testova u 3 fajla:

- SSRF zaštita za webhook-ove (`src/lib/url-safety.test.ts`)
- Heširanje sesijskih tokena (`src/lib/auth.test.ts`)
- Regresioni test za navigaciju — sprečava da se bag sa prevodom ikad vrati neprimećeno (`src/config/nav.test.ts`)

---

## 13. `loading.tsx` / `error.tsx` granice

Dodate za dashboard rute (`src/app/[lang]/(dashboard)/loading.tsx`, `error.tsx`) i prilagođena `not-found.tsx` stranica — ranije ih nije bilo nigde u aplikaciji, pa je svaka stranica ručno rešavala učitavanje/greške.

---

## 14. Čišćenje mrtvog koda

- Obrisani `-broken` fajlovi (`dashboard-page-content-broken.tsx`, `maintenance/page-broken.tsx`), neiskorišćen `src/lib/notification-service.ts`, dupliran `dictionaries/en.json` u root-u, nedostižna `/login` ruta van `[lang]` stabla (middleware ju je uvek preusmeravao, nikad se nije mogla otvoriti).
- Uklonjeni neiskorišćeni paketi iz `package.json`: `firebase`, `@react-email/render`.

---

## Napomena o obimu

Sledeće je svesno ostavljeno van ove sesije, uz razlog:

- **Puna i18n pokrivenost** van navigacije (stanari, radnici, održavanje, podešavanja, dijalozi) — po eksplicitnoj odluci tokom sesije da se ostavi za kasnije. *(Dovršeno u sesiji od 3. septembra 2026 — vidi ispod.)*
- **In-memory skladištenje za SSE konekcije i notifikacije preko više instanci** — ostaje trenutno rešenje; puna arhitektonska promena (npr. Postgres LISTEN/NOTIFY) nosi rizik, a trenutni deploy cilj (`apphosting.yaml`, maxInstances: 1) i dalje radi na jednoj instanci.
- **`npm audit` (124 ranjivosti)** — sve postojale i pre ove sesije, dolaze iz `genkit-cli` lanca zavisnosti; zahtevaju posebnu, pažljivo testiranu turu ažuriranja.
- **Puna funkcija zakupa/rente** (Lease/Unit tok) i **dodela jednog radnika na više nekretnina istovremeno** — trenutna šema baze to ne podržava; zahteva novu poslovnu odluku o modelu podataka, ne samo popravku bag-a.

---

# Sesija: 3. septembar 2026.

**Datum:** 3. septembar 2026. **Vreme:** 11:16 (CEST)

Nastavak prethodne sesije: dovršena puna nemačka lokalizacija aplikacije (stavka ostavljena otvorenom prošli put) i otklonjen bag zbog kog prevod nije radio u pregledaču uprkos ispravnom serverskom renderovanju.

---

## 1. Puna nemačka (i18n) lokalizacija aplikacije

Prevedeni preostali delovi aplikacije koji do sada nisu bili povezani sa rečnikom (`src/dictionaries/en.ts` i `de.ts`, sa TypeScript proverom strukturne usklađenosti između jezika):

- Zahtevi za održavanje — lista (paginacija, tabovi, tabela) i detaljna stranica (status/dodela, radni nalozi, ćaskanje, notifikacije), oba dijaloga za kreiranje zahteva.
- Stanari, radnici (uključujući profil radnika), nekretnine — dovršeni preostali dijalozi.
- Dokumenti, profil naloga, podešavanja (kompanija, administratori, uloge, tema), AI generator i AI asistent, naplata kirije, obe varijante stranice za upravljanje nekretninama.
- Glavna tabla (dashboard), zaglavlje aplikacije (prekidač teme, prekidač jezika, zvono za notifikacije, nalog meni, dugme "Nova prijava") i dijalog za pretragu — ovo je posebno provereno jer je izgledalo prevedeno, a nije bilo.

Deo posla urađen paralelno kroz pozadinski agent (mehanički deo: dijalozi, dokumenti, profil, podešavanja, AI, kirija, upravljanje nekretninama), dok je detaljna stranica zahteva za održavanje i dashboard/zaglavlje urađeno ručno zbog složenosti.

Usput otkrivena i ispravljena dva prava bag-a (ne prevod, već potpuno prazan prikaz): dugme "Add Work Log" i bedž statusa na detaljnoj stranici zahteva za održavanje nisu imali nikakav tekst, ni na engleskom.

---

## 2. Bag: prevod se nije menjao klikom na dugme za jezik

Korisnik je prijavio da klik na "DE" u zaglavlju ne menja ništa. Uzrok pronađen headless-browser testom (CDP, simulirani pravi klik miša): server je ispravno slao nemački HTML, ali je u pregledaču odmah po hidrataciji tekst vraćan na engleski.

Razlog: u projektu su postojala **dva fajla za isti import** — `src/hooks/use-translation.ts` (ispravan, prosleđuje pravi hook) i `src/hooks/use-translation.tsx` (zaostali duplikat sa sopstvenim, nikad povezanim kontekstom koji je uvek vraćao prazan objekat). Server-side render je koristio ispravan fajl, ali je klijentski JS paket razrešavao isti import na pogrešan — pa je svaka `dict?.x?.y || "fallback"` vrednost posle hidratacije padala na engleski fallback, bez obzira na URL (`/de/...`).

Popravka: obrisan zaostali `.tsx` fajl; ispravljen jedini fajl (`login-page-content.tsx`) koji je bio napisan za pogrešan (ne-destrukturirani) oblik povratne vrednosti hook-a. Potvrđeno uživo (simulirani klik na "DE" dugme) da se sada cela stranica, uključujući tabelu i dinamičke podatke, odmah prebacuje na nemački.

---

## 3. Dashboard, zaglavlje i pretraga nisu bili prevedeni

Korisnik je primetio da dashboard, pretraga u zaglavlju i "ostali dugmići" ostaju na engleskom uprkos prethodnoj lokalizaciji. Pregledom je otkriveno da je uzrok drugačiji na svakom mestu:

- **Dashboard** je imao sopstveni, lažni `useTranslation()` (definisan lokalno u fajlu, hardkodovan samo na engleskom) koji nije imao nikakve veze sa pravim rečnikom — pozivan je čak i van komponente, na nivou modula. Zamenjen pravim hook-om; ostatak hardkodovanih stringova (zaglavlja tabele, stanja učitavanja/praznine, bedž statusa, "Resident of...") prebačen na rečnik.
- **Zaglavlje aplikacije** (prekidač teme, prekidač jezika, zvono za notifikacije, meni naloga, dugme "Nova prijava") i **dijalog za pretragu** nikad nisu bili povezani sa rečnikom — jednostavno nisu bili obrađeni u prethodnom prolazu. Dodati u rečnik i povezani.

Potvrđeno uživo (headless Chrome, simulirani klikovi) da se dashboard, zaglavlje, meni naloga i dijalog za pretragu sada u potpunosti prebacuju na nemački.

---

## 4. Redizajn mobilnog zaglavlja

Korisnik je poslao snimak ekrana mobilne verzije i pitao da li je zaglavlje dobro dizajnirano. Zaglavlje je imalo 7 sitnih dugmića zbijenih u jedan red (meni, pretraga, dodaj, svetla/tamna tema, jezik, notifikacije, avatar) — bez teksta, teško za pogoditi prstom, sa sekundarnim akcijama (tema, jezik) na istom mestu kao primarne (pretraga, notifikacije).

Prekidač teme i prekidač jezika premešteni iz stalno vidljivog reda dugmića u meni ispod avatara (sa kvačicom koja pokazuje aktivan izbor) — ali **samo na mobilnim širinama** (`sm:hidden` na dodatim stavkama menija, `hidden sm:flex` na originalnim dugmićima). Desktop prikaz ostaje potpuno nepromenjen. Mobilno zaglavlje sada ima 5 dugmića umesto 7.

Potvrđeno snimcima ekrana (headless Chrome, mobilna i desktop emulacija) — mobilni red je vidno rasterećen, meni naloga sadrži nove stavke sa ispravnim kvačicama, desktop identičan kao pre.

---

## Provera

- `npx tsc --noEmit`, `npm run build`, `npx vitest run` (18/18) — bez novih grešaka nakon svih izmena.
- Headless Chrome (CDP) sa simuliranim pravim klikovima miša: prijava, klik na prekidač jezika, provera da se tabela, zaglavlje, dashboard i dijalog za pretragu stvarno prebacuju na nemački — ne samo statički HTML pri direktnoj poseti, već i posle klijentske navigacije.
- Snimci ekrana u mobilnoj (390×844) i desktop (1400×900) emulaciji pre/posle redizajna zaglavlja.

---

## Napomena o obimu (sesija od 3. septembra)

- Notifikacije koje se generišu unutar detaljne stranice zahteva za održavanje (npr. "Zahtev dodeljen", "Rad započet") sada koriste rečnik, ali same notifikacije koje su ranije kreirane u bazi (pre ove sesije) ostaju na jeziku na kom su originalno sačuvane — tekst notifikacije se ne prevodi retroaktivno.
