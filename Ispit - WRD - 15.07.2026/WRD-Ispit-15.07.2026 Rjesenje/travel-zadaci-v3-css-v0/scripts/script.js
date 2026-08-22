/* -------------------------------------------------------------------------- */
/* API putanje su pripremljene                                                 */
/* -------------------------------------------------------------------------- */

const API_PONUDE = "https://wrd-api.fit.ba/Ispit20250712/GetNovePonude";
const API_REZERVACIJE = "https://wrd-api.fit.ba/Ispit20250712/Dodaj";

let globalPodaci = [];
let odabranoPutovanje = null;

const ErrorBackgroundColor = "#FE7D7D";
const OkBackgroundColor = "#DFF6D8";

/* -------------------------------------------------------------------------- */
/* Pripremljene poruke                                                         */
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
    <button type="button" aria-label="Zatvori poruku">×</button>
  `;

  function ukloniPoruku() {
    poruka.classList.add("is-hiding");
    window.setTimeout(function () {
      poruka.remove();
    }, 220);
  }

  poruka.querySelector("button").addEventListener("click", ukloniPoruku);
  container.appendChild(poruka);

  if (trajanje > 0) window.setTimeout(ukloniPoruku, trajanje);
}

function messageDanger(htmlPoruka) {
  prikaziPoruku("error", "Greška", htmlPoruka);
}

function dialogSuccess(htmlPoruka) {
  prikaziPoruku("success", "Rezervacija je evidentirana", htmlPoruka, 7500);
}

function postaviApiPoruku(html) {
  if (document.getElementById("poruke")) {
    document.getElementById("poruke").innerHTML = html;
  }
}

/* -------------------------------------------------------------------------- */
/* Pripremljeno: preuzimanje i osnovni prikaz ponuda                          */
/* -------------------------------------------------------------------------- */

async function k1_preuzmi() {
  const destinacije = document.getElementById("destinacije");
  if (!destinacije) return;

  globalPodaci = [];
  odabranoPutovanje = null;
  postaviApiPoruku("");

  destinacije.innerHTML = `
    <div class="loading-card">
      <span class="loading-spinner" aria-hidden="true"></span>
      <div>
        <strong>Učitavanje ponuda...</strong>
        <p>Podaci se preuzimaju sa WRD API-ja.</p>
      </div>
    </div>
  `;

  try {
    const odgovor = await fetch(API_PONUDE, { cache: "no-store" });
    if (!odgovor.ok) throw new Error(`API status ${odgovor.status}`);

    const body = await odgovor.json();
    globalPodaci = Array.isArray(body.podaci) ? body.podaci : [];

    if (globalPodaci.length === 0) {
      destinacije.innerHTML = `
        <div class="empty-state">
          <strong>Trenutno nema dostupnih ponuda.</strong>
          <p>API nije vratio nijednu destinaciju.</p>
        </div>
      `;
      return;
    }

    prikaziDestinacije(globalPodaci);
    azurirajBrojRezultata(globalPodaci.length);
    postaviApiPoruku(`
      <div class="api-status api-status-success">
        <span></span>
        Učitano je ${globalPodaci.length} ponuda sa API-ja.
      </div>
    `);
  } catch (greska) {
    console.error("Greška pri preuzimanju ponuda:", greska);
    destinacije.innerHTML = `
      <div class="empty-state error-state">
        <strong>Ponude nisu učitane.</strong>
        <p>Provjeri internet konekciju i pokreni stranicu preko Live Servera.</p>
        <button type="button" onclick="k1_preuzmi()">Pokušaj ponovo</button>
      </div>
    `;
    postaviApiPoruku(
      '<div class="api-status api-status-error">API trenutno nije dostupan.</div>',
    );
    messageDanger("Greška pri učitavanju ponuda sa API-ja.");
  }
}

function prikaziDestinacije(podaci) {
  const destinacije = document.getElementById("destinacije");
  if (!destinacije) return;

  if (!Array.isArray(podaci) || podaci.length === 0) {
    destinacije.innerHTML = `
      <div class="empty-state">
        <strong>Nema ponuda koje odgovaraju pretrazi.</strong>
        <p>Promijeni tekstualni pojam ili minimalan broj noćenja.</p>
      </div>
    `;
    return;
  }

  destinacije.innerHTML = podaci
    .map(function (ponuda) {
      const originalIndex = globalPodaci.indexOf(ponuda);
      const naredniPolazak = ponuda.naredniPolazak || {};
      const gradovi = Array.isArray(ponuda.boravakGradovi)
        ? ponuda.boravakGradovi
        : [];

      let ukupnoNocenja = 0;
      let gradoviHtml = "";

      for (let i = 0; i < gradovi.length; i++) {
        ukupnoNocenja += Number(gradovi[i].brojNocenja);
        gradoviHtml += `
          <span class="city-chip">
            ${gradovi[i].nazivGrada} · ${gradovi[i].brojNocenja} noći
          </span>
        `;
      }

      const akcijaHtml = ponuda.akcijaPoruka
        ? `<span class="offer-sale">${ponuda.akcijaPoruka}</span>`
        : "";

      return `
        <article class="destination-card" data-destination-index="${originalIndex}">
          <div class="destination-image-wrap">
            <img
              src="${ponuda.slikaUrl}"
              alt="${ponuda.drzava}"
              loading="lazy"
              onerror="this.closest('.destination-image-wrap').classList.add('image-error'); this.remove();"
            />
            ${akcijaHtml}
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
            <div class="offer-cities">${gradoviHtml}</div>

            <div class="offer-info-grid four-items">
              <div>
                <span>Polazak</span>
                <strong>${naredniPolazak.datumPol || "Nije objavljeno"}</strong>
              </div>
              <div>
                <span>Slobodna mjesta</span>
                <strong>${naredniPolazak.countSlobodnoMjesta ?? 0}</strong>
              </div>
              <div>
                <span>Ukupno noćenja</span>
                <strong>${ukupnoNocenja}</strong>
              </div>
              <div>
                <span>Cijena po osobi</span>
                <strong>${Number(naredniPolazak.cijenaPoOsobiEur).toFixed(2)} €</strong>
              </div>
            </div>

            <button
              class="choose-offer-button"
              type="button"
              onclick="k2_odaberiDestinaciju(${originalIndex})"
            >
              Prikaži termine
              <span>→</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

/* -------------------------------------------------------------------------- */
/* Z1 — filtriranje ponuda                                                     */
/* -------------------------------------------------------------------------- */

function primijeniFiltere() {
  // TODO Z1:
  // - tekstualna pretraga po državi, gradu ili opisu;
  // - minimalan ukupan broj noćenja;
  // - kombinovati oba filtera;
  // - osvježiti kartice i broj rezultata.


  let pojam = document.getElementById("pretraga-pojam").value.toLowerCase();
  let minNocenja = Number(document.getElementById("filterNocenja").value);

  let filtriranePonude = [];
  for (let i = 0; i < globalPodaci.length; i++) {
    let ponuda = globalPodaci[i];

    let ukupnoNocenja = 0;
    let gradovi = "";

    for (let j = 0; j < ponuda.boravakGradovi.length; j++) {
      ukupnoNocenja += Number(ponuda.boravakGradovi[j].brojNocenja);
      gradovi += ponuda.boravakGradovi[j].nazivGrada.toLowerCase() + " ";
    }

    let drzava = ponuda.drzava.toLowerCase();
    let opis = ponuda.opisPonude.toLowerCase();

    let odgovaraTekst =
      drzava.includes(pojam) ||
      gradovi.includes(pojam) ||
      opis.includes(pojam);

    let odgovaraNocenja = ukupnoNocenja >= minNocenja;

    if (odgovaraTekst && odgovaraNocenja) {
      filtriranePonude.push(ponuda);
    }
  }

  prikaziDestinacije(filtriranePonude);
  azurirajBrojRezultata(filtriranePonude.length);
}

function azurirajBrojRezultata(broj) {
  // TODO Z1: prikazati broj rezultata u elementu #rezultatiBroj.
  document.getElementById("rezultatiBroj").textContent = broj;

}

/* -------------------------------------------------------------------------- */
/* Pripremljeno: osnovni prikaz termina                                        */
/* -------------------------------------------------------------------------- */

function k2_odaberiDestinaciju(indexPonude) {
  const ponuda = globalPodaci[indexPonude];
  const tabela = document.getElementById("putovanjaTabela");

  if (!ponuda || !tabela) {
    messageDanger("Odabrana ponuda nije pronađena.");
    return;
  }

  odabranoPutovanje = null;

  document.querySelectorAll(".destination-card").forEach(function (kartica) {
    kartica.classList.remove("selected-card");
  });
  document
    .querySelector(`[data-destination-index="${indexPonude}"]`)
    ?.classList.add("selected-card");

  document.getElementById("brojOdraslih").value = "";
  document.getElementById("brojDjece").value = "0";
  document.getElementById("ukupnoPutnika").value = "";
  document.getElementById("ukupnaCijena").value = "";
  document.getElementById("gosti").innerHTML =
    '<div class="guest-info">Odaberi termin, zatim unesi broj odraslih i djece.</div>';

  const putovanja = Array.isArray(ponuda.planiranaPutovanja)
    ? ponuda.planiranaPutovanja
    : [];

  if (putovanja.length === 0) {
    tabela.innerHTML =
      '<tr><td colspan="7">Za ovu destinaciju nema planiranih putovanja.</td></tr>';
    return;
  }

  tabela.innerHTML = putovanja
    .map(function (putovanje, indexPutovanja) {
      const slobodnaMjesta = Number(putovanje.countSlobodnoMjesta);
      const popunjeno = slobodnaMjesta <= 0;

      console.log(putovanje.datumPol);
      console.log(putovanje.datumPov);

      // let datumPolaska = new Date(putovanje.datumPol);
      // let datumPovratka = new Date(putovanje.datumPov);

      let pol = putovanje.datumPol.split(".");
      let pov = putovanje.datumPov.split(".");

      let datumPolaska = new Date(pol[2], pol[1] - 1, pol[0]);
      let datumPovratka = new Date(pov[2], pov[1] - 1, pov[0]);

      let razlika = datumPovratka - datumPolaska;

      let trajanje = razlika / (1000 * 60 * 60 * 24);

      return `
        <tr id="putovanje-red-${indexPutovanja}">
          <td><strong>#${putovanje.idPutovanje}</strong></td>
          <td>${putovanje.datumPol}</td>
          <td>${putovanje.datumPov}</td>
          <td> ${trajanje} dana</td>
          <td>
            <span class="seats-badge ${popunjeno ? "sold-out" : ""}">
              ${slobodnaMjesta}
            </span>
          </td>
          <td><strong>${Number(putovanje.cijenaPoOsobiEur).toFixed(2)} €</strong></td>
          <td>
            <button
              type="button"
              ${popunjeno ? "disabled" : ""}
              onclick="k3_odaberiPutovanje(${indexPonude}, ${indexPutovanja})"
            >${popunjeno ? "Popunjeno" : "Odaberi"}</button>
          </td>
        </tr>
      `;
    })
    .join("");

}

/* -------------------------------------------------------------------------- */
/* Z2 — trajanje i odabir termina                                              */
/* -------------------------------------------------------------------------- */

function k3_odaberiPutovanje(indexPonude, indexPutovanja) {
  // TODO Z2:
  // - sačuvati odabrano putovanje u globalnu varijablu odabranoPutovanje;
  // - označiti samo trenutno odabrani red;
  // - ukloniti marker sa prethodno odabranog reda.
  //
  // Izračun trajanja u danima dodati u funkciju za prikaz termina.

  odabranoPutovanje = globalPodaci[indexPonude].planiranaPutovanja[indexPutovanja];

  document.querySelectorAll("#putovanjaTabela tr").forEach(x => {
    x.classList.remove("selected-row");
  });

  document.getElementById(`putovanje-red-${indexPutovanja}`).classList.add("selected-row");


}

/* -------------------------------------------------------------------------- */
/* Z3 — odrasli, djeca, dinamička polja i cijena                              */
/* -------------------------------------------------------------------------- */

function k4_promjenaPutnika() {
  // TODO Z3:
  // - provjeriti broj odraslih i djece prema pravilima zadatka;
  // - generisati polja za ime i prezime svakog putnika;
  // - sačuvati ranije unesena imena za polja koja i dalje postoje;
  // - vizuelno razlikovati odrasle i djecu;
  // - izračunati i prikazati ukupnu cijenu rezervacije.

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

  let odrasli = Number(inputOdrasli.value);
  let djeca = Number(inputDjeca.value);

  let ukupno = odrasli + djeca;

  document.getElementById("ukupnoPutnika").value = ukupno;


  if (greska != "") {

    inputOdrasli.style.backgroundColor = ErrorBackgroundColor;
    inputDjeca.style.backgroundColor = ErrorBackgroundColor;

    status.textContent = greska;
    status.style.backgroundColor = ErrorBackgroundColor;

    document.getElementById("ukupnaCijena").value = "";

    return;
  }


  inputOdrasli.style.backgroundColor = OkBackgroundColor;
  inputDjeca.style.backgroundColor = OkBackgroundColor;


  let gosti = document.getElementById("gosti");

  gosti.innerHTML = "";


  for (let i = 0; i < odrasli; i++) {

    let input = document.createElement("input");

    input.type = "text";
    input.placeholder = "Odrasli " + (i + 1);
    input.className = "adult-guest";

    if (stariOdrasli[i] != undefined) {
      input.value = stariOdrasli[i];
    }

    gosti.appendChild(input);
  }


  for (let i = 0; i < djeca; i++) {

    let input = document.createElement("input");

    input.type = "text";
    input.placeholder = "Dijete " + (i + 1);
    input.className = "child-guest";

    if (staraDjeca[i] != undefined) {
      input.value = staraDjeca[i];
    }

    gosti.appendChild(input);
  }


  let cijena = Number(odabranoPutovanje.cijenaPoOsobiEur);

  let ukupnaCijena =
    odrasli * cijena +
    djeca * (cijena * 0.7);

  document.getElementById("ukupnaCijena").value =
    ukupnaCijena.toFixed(2) + " €";


  status.textContent = "Generisana su polja za " + odrasli + " odraslih i " + djeca + " djece.";

  status.style.backgroundColor = OkBackgroundColor;
}

function provjeriBrojPutnika() {
  // TODO Z3/Z5: vratiti prazan string kada su brojevi ispravni,
  // a tekst greške kada nisu ispravni.

  let odrasli = Number(document.getElementById("brojOdraslih").value);
  let djeca = Number(document.getElementById("brojDjece").value);

  let ukupno = odrasli + djeca;

  if (odrasli < 1) {
    return "Mora biti najmanje jedna odrasla osoba.\n";
  }

  if (ukupno < 2 || ukupno > 5) {
    return "Ukupan broj putnika mora biti od 2 do 5.\n";
  }

  if (!Number.isInteger(odrasli) || !Number.isInteger(djeca)) {
    return "Broj odraslih i djece mora biti cijeli broj.\n";
  }

  if (odabranoPutovanje == null) {
    return "Putovanje nije odabrano.\n";
  }

  if (ukupno > odabranoPutovanje.countSlobodnoMjesta) {
    return "Nema dovoljno slobodnih mjesta.\n";
  }

  return "";
}

/* -------------------------------------------------------------------------- */
/* Z4 — frontend validacija                                                    */
/* -------------------------------------------------------------------------- */

function provjeriPasos() {
  // TODO Z4: validacija identifikacionog dokumenta i bojenje polja.
    let pasos = document.getElementById("brojPasosa");

  if (!/^BIH-[0-9]{6}-[A-F]$/.test(pasos.value)) {
    pasos.style.backgroundColor = ErrorBackgroundColor;
    return "Identifikacioni dokument nije ispravan.\n";
  } else {
    pasos.style.backgroundColor = OkBackgroundColor;
    return "";
  }
}

function provjeriEmail() {
  // TODO Z4: validacija email adrese i bojenje polja.
  let email = document.getElementById("email");

  if (!/^[a-z]{2,}\.[a-z]{2,}[0-9]{0,2}@(travel\.ba|fit\.ba)$/.test(email.value)) {
    email.style.backgroundColor = ErrorBackgroundColor;
    return "Email nije ispravan.\n";
  } else {
    email.style.backgroundColor = OkBackgroundColor;
    return "";
  }
}

// DODANO U VERZIJI ZA VJEŽBU — ovaj primjer nije bio u starter projektu
// korištenom na ispitu 15.07.2026. Primjer pokazuje upotrebu regexa i .test().
//
// function provjeriBrojTelefona() {
//   let phone = document.getElementById("phone");
//
//   if (!/^\+387 6[0-9] \d{3} \d{3}$/.test(phone.value)) {
//     phone.style.backgroundColor = ErrorBackgroundColor;
//     return "Telefon mora biti u formatu: +387 61 123 456\n";
//   } else {
//     phone.style.backgroundColor = OkBackgroundColor;
//     return "";
//   }
// }

/* -------------------------------------------------------------------------- */
/* Z5 — kreiranje objekta i slanje rezervacije                                */
/* -------------------------------------------------------------------------- */

function kreirajObjekatRezervacije() {
  // TODO Z5: kreirati objekat prema Swagger shemi Ispit20250712DodajRequest
  // i dodati tražene dodatne frontend podatke.

  let imena = [];
  let tipoviPutnika = [];

  document.querySelectorAll("#gosti input").forEach(x => {
    imena.push(x.value);

    if (x.classList.contains("adult-guest")) {
      tipoviPutnika.push("Odrasli");
    } else if (x.classList.contains("child-guest")) {
      tipoviPutnika.push("Dijete");
    }
  });


  let obj = {
    putovanjeID: String(odabranoPutovanje.idPutovanje),

    destinacijaNaziv:document.querySelector(".selected-card h3").textContent,

    datumPolazak: odabranoPutovanje.datumPol,

    cijenaTotal: Number(document.getElementById("ukupnaCijena").value.replace(" €", "")),

    imenaGostiju: imena,

    brojPasos: document.getElementById("brojPasosa").value,

    emailAdress: document.getElementById("email").value,


    telefon: document.getElementById("phone").value,

    brojOdraslih:Number(document.getElementById("brojOdraslih").value),

    brojDjece: Number(document.getElementById("brojDjece").value),
    tipoviPutnika: tipoviPutnika
  };


  return obj;
}

function k5_posalji() {
  let frontendGreskeValidacije = "";

  // TODO Z5:
  // - pozvati sve frontend validacije;
  // - spojiti njihove poruke u frontendGreskeValidacije;
  // - blokirati POST ako postoji barem jedna greška.

  frontendGreskeValidacije += provjeriBrojPutnika();
  frontendGreskeValidacije += provjeriPasos();
  frontendGreskeValidacije += provjeriEmail();

  if (frontendGreskeValidacije !== "") {
    messageDanger(
      "Frontend validacija:<br><br>" +
      frontendGreskeValidacije.replace(/\n/g, "<br>"),
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
        dialogSuccess(
          "Uspješno kreirana rezervacija sa brojem: " + body.idRezervacije,
        );
      } else {
        const backendGreskeValidacije = Array.isArray(body.spisakGresaka)
          ? body.spisakGresaka.join("<br>")
          : "API je odbio poslane podatke.";

        messageDanger(
          "Backend validacija: Poslati JSON podaci nisu ispravni.<br><br>" +
          backendGreskeValidacije,
        );
      }
    })
    .catch(function () {
      messageDanger("Greška pri slanju rezervacije.");
    });
}

document.addEventListener("DOMContentLoaded", k1_preuzmi);
