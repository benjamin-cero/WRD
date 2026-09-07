/* -------------------------------------------------------------------------- */
/* WRD — septembarski rok 05.09.2026. — STUDENTSKI STARTER                     */
/* Stil je namjerno jednostavan (kao raniji rokovi i vježbe):                  */
/* .then() umjesto async/await, for petlje i innerHTML += umjesto .map().      */
/* -------------------------------------------------------------------------- */

/* API putanje su pripremljene */
const API_PONUDE = "https://wrd-api.fit.ba/Ispit20260905/GetNovePonude";
const API_REZERVACIJE = "https://wrd-api.fit.ba/Ispit20260905/Dodaj";

let globalPodaci = [];
let odabranoPutovanje = null;

let ErrorBackgroundColor = "#FE7D7D";
let OkBackgroundColor = "#DFF6D8";

const SERVISNA_NAKNADA = 15;

/* -------------------------------------------------------------------------- */
/* Pripremljene poruke                                                        */
/* -------------------------------------------------------------------------- */

function prikaziPoruku(tip, naslov, tekst, trajanje = 5500) {
  let container = document.getElementById("app-poruke");

  if (!container) {
    container = document.createElement("div");
    container.id = "app-poruke";
    container.className = "app-messages";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const poruka = document.createElement("div");
  poruka.className = `app-message app-message-${tip}`;
  poruka.innerHTML = `
    <div>
      <strong>${naslov}</strong>
      <p>${tekst}</p>
    </div>
    <button type="button" aria-label="Zatvori poruku">×</button>`;

  function ukloni() {
    poruka.classList.add("is-hiding");
    setTimeout(function () {
      poruka.remove();
    }, 220);
  }

  poruka.querySelector("button").addEventListener("click", ukloni);
  container.appendChild(poruka);
  if (trajanje > 0) setTimeout(ukloni, trajanje);
}

function messageDanger(x) {
  prikaziPoruku("error", "Greška", x);
}

function dialogSuccess(x) {
  prikaziPoruku("success", "Rezervacija je evidentirana", x, 7500);
}

function postaviApiPoruku(html) {
  const e = document.getElementById("poruke");
  if (e) e.innerHTML = html;
}

function postaviStatus(tekst, tip = "info") {
  const status = document.getElementById("statusRezervacije");
  if (!status) return;

  status.textContent = tekst;
  status.classList.remove("status-info", "status-success", "status-error");
  status.classList.add(`status-${tip}`);
}

/* -------------------------------------------------------------------------- */
/* Pomoćne funkcije                                                           */
/* -------------------------------------------------------------------------- */

function formatirajCijenu(iznos) {
  return `${Number(iznos).toFixed(2)} €`;
}

function procitajBroj(id) {
  return Number(document.getElementById(id).value);
}


/* -------------------------------------------------------------------------- */
/* K1 — preuzimanje ponuda i prikaz kartica                                   */
/* -------------------------------------------------------------------------- */

function k1_preuzmi() {
  const destinacije = document.getElementById("destinacije");
  if (!destinacije) return;

  destinacije.innerHTML = `
    <div class="loading-card">
      <span class="loading-spinner"></span>
      <div>
        <strong>Učitavanje ponuda...</strong>
        <p>Podaci se preuzimaju sa WRD API-ja.</p>
      </div>
    </div>`;

  fetch(API_PONUDE)
    .then(function (res) {
      return res.json();
    })
    .then(function (body) {
      globalPodaci = body.podaci;

      // Korisno pri radu: u konzoli se vidi tačna struktura podataka.
      console.log(globalPodaci);

      destinacije.innerHTML = "";

      for (let i = 0; i < globalPodaci.length; i++) {
        const ponuda = globalPodaci[i];
        const naredni = ponuda.naredniPolazak;

        let gradovi = "";
        let nocenja = 0;

        for (let j = 0; j < ponuda.boravakGradovi.length; j++) {
          nocenja += Number(ponuda.boravakGradovi[j].brojNocenja);
          gradovi += `
            <span class="city-chip">
              ${ponuda.boravakGradovi[j].nazivGrada} · ${ponuda.boravakGradovi[j].brojNocenja} noći
            </span>`;
        }

        let akcija = "";
        if (ponuda.akcijaPoruka) {
          akcija = `<span class="offer-sale">${ponuda.akcijaPoruka}</span>`;
        }

        destinacije.innerHTML += `
          <article class="destination-card" data-destination-index="${i}">
            <div class="destination-image-wrap">
              <img src="${ponuda.slikaUrl}" alt="${ponuda.drzava}" loading="lazy">
              ${akcija}
            </div>

            <div class="destination-content">
              <div class="destination-title-row">
                <div>
                  <span class="destination-kicker">Ponuda #${ponuda.id}</span>
                  <h3>${ponuda.drzava}</h3>
                </div>
                <span class="destination-arrow">↗</span>
              </div>

              <p class="destination-description">${ponuda.opisPonude}</p>
              <div class="offer-cities">${gradovi}</div>

              <div class="offer-info-grid four-items">
                <div>
                  <span>Polazak</span>
                  <strong>${naredni.datumPol}</strong>
                </div>
                <div>
                  <span>Mjesta</span>
                  <strong>${naredni.countSlobodnoMjesta}</strong>
                </div>
                <div>
                  <span>Noćenja</span>
                  <strong>${nocenja}</strong>
                </div>
                <div>
                  <span>Od</span>
                  <strong>${formatirajCijenu(naredni.cijenaPoOsobiEur)}</strong>
                </div>
              </div>

              <button class="choose-offer-button" onclick="k2_odaberiDestinaciju(${i})">
                Prikaži termine <span>→</span>
              </button>
            </div>
          </article>`;
      }

      azurirajBrojRezultata(globalPodaci.length);
    })
    .catch(function () {
      destinacije.innerHTML = `
        <div class="empty-state error-state">
          <strong>Ponude nisu učitane.</strong>
          <p>Provjeri internet konekciju i Live Server.</p>
          <button onclick="k1_preuzmi()">Pokušaj ponovo</button>
        </div>`;
      messageDanger("Greška pri učitavanju ponuda sa API-ja.");
    });
}

k1_preuzmi();

/* -------------------------------------------------------------------------- */
/* Z1 — filtriranje ponuda (tekst + maksimalna cijena)                        */
/* -------------------------------------------------------------------------- */

function primijeniFiltere() {
  // TODO Z1:
  // - tekstualna pretraga po državi, gradu ili opisu (ne razlikuje velika/mala slova);
  // - maksimalna cijena po osobi iz #filterCijena, prema narednom polasku ponude;
  // - vrijednost 0 znači da cijena nije ograničena;
  // - kombinovati oba uslova, ispisati kartice i osvježiti broj rezultata.

  let pojam = document.getElementById("pretraga-pojam").value.toLowerCase();
  let maxCijena = Number(document.getElementById("filterCijena").value);

  let kartice = document.querySelectorAll(".destination-card");
  let brojRezultata = 0;

  for (let i = 0; i < globalPodaci.length; i++) {

    let ponuda = globalPodaci[i];

    let drzava = ponuda.drzava.toLowerCase();
    let opis = ponuda.opisPonude.toLowerCase();
    let gradovi = "";

    for (let j = 0; j < ponuda.boravakGradovi.length; j++) {
      gradovi += ponuda.boravakGradovi[j].nazivGrada.toLowerCase() + " ";
    }

    let odgovaraTekst =
      drzava.includes(pojam) ||
      opis.includes(pojam) ||
      gradovi.includes(pojam);

    let cijena = Number(ponuda.naredniPolazak.cijenaPoOsobiEur);

    let odgovaraCijena = false;

    if (maxCijena == 0 || cijena <= maxCijena) {
      odgovaraCijena = true;
    }

    if (odgovaraTekst == true && odgovaraCijena == true) {
      kartice[i].style.display = "";
      brojRezultata++;
    }
    else {
      kartice[i].style.display = "none";
    }
  }

  azurirajBrojRezultata(brojRezultata);
}

function azurirajBrojRezultata(broj) {
  // TODO Z1: prikazati broj rezultata u #rezultatiBroj.
  document.getElementById("rezultatiBroj").textContent = broj;
}

/* -------------------------------------------------------------------------- */
/* K2 — prikaz termina odabrane destinacije                                   */
/* -------------------------------------------------------------------------- */

function k2_odaberiDestinaciju(indexPonude) {
  const ponuda = globalPodaci[indexPonude];
  const tabela = document.getElementById("putovanjaTabela");

  if (!ponuda || !tabela) {
    messageDanger("Odabrana ponuda nije pronađena.");
    return;
  }

  odabranoPutovanje = null;

  const kartice = document.querySelectorAll(".destination-card");
  for (let i = 0; i < kartice.length; i++) {
    kartice[i].classList.remove("selected-card");
  }
  const aktivna = document.querySelector(`[data-destination-index="${indexPonude}"]`);
  if (aktivna) aktivna.classList.add("selected-card");

  document.getElementById("brojOdraslih").value = "";
  document.getElementById("brojDjece").value = "0";
  document.getElementById("ukupnoPutnika").value = "";
  document.getElementById("ukupnaCijena").value = "";
  document.getElementById("gosti").innerHTML =
    '<div class="guest-info">Odaberi termin, zatim unesi broj odraslih i djece.</div>';

  postaviStatus("Odaberi jedan od dostupnih termina.", "info");

  const putovanja = ponuda.planiranaPutovanja;

  if (!putovanja || putovanja.length === 0) {
    tabela.innerHTML =
      '<tr><td colspan="7">Za ovu destinaciju nema planiranih putovanja.</td></tr>';
    return;
  }

  tabela.innerHTML = "";

  for (let i = 0; i < putovanja.length; i++) {
    const putovanje = putovanja[i];
    const slobodnaMjesta = Number(putovanje.countSlobodnoMjesta);
    const popunjeno = slobodnaMjesta <= 0;

    // TODO Z2: ovdje izračunati trajanje putovanja iz datumPol i datumPov.


    let pol = putovanje.datumPol.split(".");
    let pov = putovanje.datumPov.split(".");

    let datumPolaska = new Date(pol[2], pol[1] - 1, pol[0]);
    let datumPovratka = new Date(pov[2], pov[1] - 1, pov[0]);

    let razlika = datumPovratka - datumPolaska;

    let trajanje = parseInt(razlika / (1000 * 60 * 60 * 24));

    tabela.innerHTML += `
      <tr id="putovanje-red-${i}">
        <td><strong>#${putovanje.idPutovanje}</strong></td>
        <td>${putovanje.datumPol}</td>
        <td>${putovanje.datumPov}</td>
        <td>${trajanje}</td>
        <td>
          <span class="seats-badge ${popunjeno ? "sold-out" : ""}">${slobodnaMjesta}</span>
        </td>
        <td><strong>${formatirajCijenu(putovanje.cijenaPoOsobiEur)}</strong></td>
        <td>
          <button ${popunjeno ? "disabled" : ""} onclick="k3_odaberiPutovanje(${indexPonude},${i})">
            ${popunjeno ? "Popunjeno" : "Odaberi"}
          </button>
        </td>
      </tr>`;
  }
}

/* -------------------------------------------------------------------------- */
/* Z2 — odabir termina i marker odabranog reda                                */
/* -------------------------------------------------------------------------- */

function k3_odaberiPutovanje(indexPonude, indexPutovanja) {
  // TODO Z2:
  // - sačuvati odabrani termin u globalnu varijablu odabranoPutovanje
  //   (uz podatke termina zapamtiti i državu ponude — treba za Z5);
  // - označiti samo trenutno odabrani red klasom selected-row,
  //   a marker skinuti sa prethodno odabranog reda;
  // - u #statusRezervacije ispisati ID termina i broj slobodnih mjesta.

  odabranoPutovanje = globalPodaci[indexPonude].planiranaPutovanja[indexPutovanja];

  document.querySelectorAll("#putovanjaTabela tr").forEach(x => {
    x.classList.remove("selected-row");
  });

  let red = document.getElementById("putovanje-red-" + indexPutovanja);
  red.classList.add("selected-row");

  postaviStatus("Odabran termin: " + odabranoPutovanje.idPutovanje + ", slobodna mjesta: " + odabranoPutovanje.countSlobodnoMjesta);

}

/* -------------------------------------------------------------------------- */
/* Z3 — putnici, dinamička polja i cijena                                     */
/* -------------------------------------------------------------------------- */

function provjeriBrojPutnika() {
  // TODO Z3/Z5: vratiti prazan string kada je unos ispravan,
  // a tekst greške kada nije.
  let odrasli = Number(document.getElementById("brojOdraslih").value);
  let djeca = Number(document.getElementById("brojDjece").value);
  let ukupno = odrasli + djeca;

  if (odrasli < 1) {
    return "Mora biti najmanje jedna odrasla osoba. \n";
  }
  if (ukupno < 2 || ukupno > 6) {
    return "Ukupan brooj putnika mora biti od 2 do 5. \n";
  }
  if (odabranoPutovanje == null) {
    return "Putovanje nije odabrano. \n";
  }
  if (ukupno > odabranoPutovanje.countSlobodnoMjesta) {
    return "Nema dovoljno slobodnih mjesta. \n";
  }
  if (!Number.isInteger(odrasli) || !Number.isInteger(djeca)) {
    return "Broj odraslih i djece mora biti cijeli broj. \n";
  }
  return "";
}

function k4_promjenaPutnika() {
  // TODO Z3:
  // - najmanje 1 odrasla osoba; ukupno 2-6 putnika; oba broja cijeli;
  // - ukupan broj ne smije preći broj slobodnih mjesta odabranog termina;
  // - generisati po jedno polje za ime i prezime svakog putnika,
  //   odrasle i djecu vizuelno razlikovati (klase traveler-card odrasli / dijete);
  // - pri promjeni broja putnika sačuvati ranije unesena imena;
  // - cijena: odrasli 100%, djeca 60% cijene po osobi, + servisna naknada 15 EUR;
  // - prikazati ukupan broj putnika i ukupnu cijenu.


  let inputOdrasli = document.getElementById("brojOdraslih");
  let inputDjeca = document.getElementById("brojDjece");
  let status = document.getElementById("statusRezervacije");

  let stariOdrasli = [];
  let staraDjeca = [];

  document.querySelectorAll("#gosti .adult-guest").forEach(x => {
    stariOdrasli.push(x.value);
  });

  document.querySelectorAll("#gosti .child-guest").forEach(x => {
    staraDjeca.push(x.value);
  });


  let greska = provjeriBrojPutnika();

  let odrasli = Number(document.getElementById("brojOdraslih").value);
  let djeca = Number(document.getElementById("brojDjece").value);
  let ukupno = odrasli + djeca;


  document.getElementById("ukupnoPutnika").value = ukupno;

  if (greska != "") {
    inputOdrasli.style.backgroundColor = ErrorBackgroundColor;
    inputDjeca.style.backgroundColor = ErrorBackgroundColor;

    status.textContent = greska;
    status.classList.remove("status-success");
    status.classList.add("status-error");

    document.getElementById("ukupnaCijena").value = "";
    return;
  }

  inputOdrasli.style.backgroundColor = OkBackgroundColor;
  inputDjeca.style.backgroundColor = OkBackgroundColor;

  let gosti = document.getElementById("gosti");

  gosti.innerHTML = "";


  for (let i = 0; i < odrasli; i++) {

    let kartica = document.createElement("div");
    kartica.className = "traveler-card odrasli";

    let badge = document.createElement("div");
    badge.className = "traveler-badge";
    badge.textContent = "O";

    let input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Odrasla osoba " + (i + 1);
    input.className = "adult-guest";

    if (stariOdrasli[i] != undefined) {
      input.value = stariOdrasli[i];
    }

    kartica.appendChild(badge);
    kartica.appendChild(input);

    gosti.appendChild(kartica);
  }

  for (let i = 0; i < djeca; i++) {

    let kartica = document.createElement("div");
    kartica.className = "traveler-card dijete";

    let badge = document.createElement("div");
    badge.className = "traveler-badge";
    badge.textContent = "D";

    let input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Dijete " + (i + 1);
    input.className = "child-guest";

    if (staraDjeca[i] != undefined) {
      input.value = staraDjeca[i];
    }

    kartica.appendChild(badge);
    kartica.appendChild(input);

    gosti.appendChild(kartica);
  }


  let cijena = Number(odabranoPutovanje.cijenaPoOsobiEur);

  let ukupnaCijena = odrasli * cijena + djeca * (cijena * 0.6) + SERVISNA_NAKNADA;


  document.getElementById("ukupnaCijena").value = ukupnaCijena.toFixed(2) + " €";

  status.textContent = "Generisana su polja za " + odrasli + " odraslih i " + djeca + " djece.";

  status.classList.remove("status-error");
  status.classList.add("status-success");
}

/* -------------------------------------------------------------------------- */
/* Z4 — frontend validacija                                                   */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/* PRIMJER regex validacije (zakomentarisan)                                   */
/* Pokazuje regularni izraz, metodu .test(), bojenje polja i vraćanje poruke.  */
/* Primjer NE rješava tražene validacije iz Z4 — treba ga razumjeti i          */
/* prilagoditi formatu dokumenta i emaila iz zadatka.                          */
/* -------------------------------------------------------------------------- */
// function provjeriBrojTelefona() {
//   let phone = document.getElementById("phone");
//
//   if (!/^\+387 6[0-9] \d{3} \d{3}$/.test(phone.value)) {
//     phone.style.backgroundColor = ErrorBackgroundColor;
//     return "Telefon mora biti u formatu: +387 61 123 456\n"; // poruka greške
//   } else {
//     phone.style.backgroundColor = OkBackgroundColor;
//     return ""; // prazan string kada je unos ispravan
//   }
// }

function provjeriPasos() {
  // TODO Z4: format TRV-1234-AB (TRV, crtica, 4 cifre, crtica, 2 velika slova A-Z).
  // Obojati polje i vratiti poruku greške (prazan string kada je ispravno).
  let pasos = document.getElementById("brojPasosa");

  if (!/^TRV-[0-9]{4}-[A-Z]{2}$/.test(pasos.value)) {

    pasos.style.backgroundColor = ErrorBackgroundColor;

    return "Dokument mora biti u formatu: TRV-1234-AB\n";

  } else {

    pasos.style.backgroundColor = OkBackgroundColor;

    return "";
  }
}

function provjeriEmail() {
  // TODO Z4: najmanje 2 mala slova, tačka, najmanje 2 mala slova,
  // opciono 1-2 cifre, znak @, pa domena wrd.ba ili fit.ba.
  // Obojati polje i vratiti poruku greške (prazan string kada je ispravno).
  let email = document.getElementById("email");

  if (!/^[a-z]{2,}\.[a-z]{2,}[0-9]{0,2}@(wrd\.ba|fit\.ba)$/.test(email.value)) {

    email.style.backgroundColor = ErrorBackgroundColor;

    return "Email mora biti u formatu: ime.prezime@wrd.ba ili ime.prezime12@fit.ba\n";

  } else {

    email.style.backgroundColor = OkBackgroundColor;

    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Z5 — kreiranje objekta i slanje rezervacije                                */
/* -------------------------------------------------------------------------- */

function kreirajObjekatRezervacije() {
  // TODO Z5: kreirati objekat prema Swagger shemi Ispit20260905DodajRequest:
  //   putovanjeBroj, destinacijaDrzava, datumPolaska, cijenaUkupno,
  //   imenaGostiju (niz), tipoviGostiju (niz), brojPasosa, email, telefon.
  // imenaGostiju i tipoviGostiju moraju imati isti broj stavki i isti redoslijed.
  // cijenaUkupno mora odgovarati obračunu iz Z3.

  let tipoviPutnika = [];
  let imena = [];
  document.querySelectorAll("#gosti input").forEach(x => {
    imena.push(x.value);

    if (x.classList.contains("adult-guest")) {
      tipoviPutnika.push("Odrasli")
    } else if (x.classList.contains("child-guest")) {
      tipoviPutnika.push("Dijete");

    }
  });

  let obj = {
    putovanjeBroj: String(odabranoPutovanje.idPutovanje),
    destinacijaDrzava: document.querySelector(".selected-card h3").textContent,
    datumPolaska: odabranoPutovanje.datumPol,
    cijenaUkupno: Number(document.getElementById("ukupnaCijena").value.replace(" €", "")),
    imenaGostiju: imena,
    tipoviGostiju: tipoviPutnika,
    brojPasosa: document.getElementById("brojPasosa").value,
    email: document.getElementById("email").value,
    telefon: document.getElementById("phone").value
  };

  return obj;
}

function k5_posalji() {
  let frontendGreskeValidacije = "";


  frontendGreskeValidacije = provjeriBrojPutnika();
  frontendGreskeValidacije = provjeriEmail();
  frontendGreskeValidacije = provjeriPasos();

  // TODO Z5: pozvati sve frontend validacije i skupiti njihove poruke
  // u frontendGreskeValidacije. Ako postoji greška, POST se ne smije izvršiti.

  if (frontendGreskeValidacije !== "") {
    postaviStatus("Provjeri označena polja prije slanja.", "error");
    messageDanger(
      "Frontend validacija:<br><br>" + frontendGreskeValidacije.replace(/\n/g, "<br>"),
    );
    return;
  }

  const jsObjekat = kreirajObjekatRezervacije();

  fetch(API_REZERVACIJE, {
    method: "POST",
    body: JSON.stringify(jsObjekat),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (body) {
      if (body.brojGresaka === 0) {
        dialogSuccess("Uspješno kreirana rezervacija sa brojem: " + body.idRezervacije);
        postaviStatus("Rezervacija je uspješno poslana.", "success");
      } else {
        messageDanger(
          "Backend validacija:<br><br>" +
          (Array.isArray(body.spisakGresaka)
            ? body.spisakGresaka.join("<br>")
            : "API je odbio podatke."),
        );
      }
    })
    .catch(function () {
      messageDanger("Greška pri slanju rezervacije.");
    });
}
