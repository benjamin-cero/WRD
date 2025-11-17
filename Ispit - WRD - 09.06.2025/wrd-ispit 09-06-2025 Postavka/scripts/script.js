let globalPodaci = [];
let k1_preuzmi = () => {
  fetch(`https://wrd-api.fit.ba/Ispit20250712/GetNovePonude`).then((res) => {
    res.json().then((body) => {
      globalPodaci = body.podaci;
      for (let i = 0; i < globalPodaci.length; i++) {
        document.getElementById("destinacije").innerHTML += `
                <div class="best-offer-wrapper">
              <div class="best-offer">
                <div class="offer-header">
                <h2 class="destinacija-counter">Destinacija ${i + 1}</h2>
                <div class="offer-details">
                <h2>${globalPodaci[i].drzava}</h2>
                  <div class="offer-date">
                    <span>Datum polaska:</span>
                    <span>${globalPodaci[i].naredniPolazak.datumPol}</span>
                  </div>
                  <div class="offer-price">
                    <span>Cijena:</span>
                    <span>${
                      globalPodaci[i].naredniPolazak.cijenaPoOsobiEur
                    }$</span>
                  </div>
                  </div>
                </div>
                <div class="offer-content-wrapper">
                <div class="offer-content">
                  <img/>


                </div>
                <div class="offer-button" onclick="k2_odaberiDestinaciju(${i})">K2 Odaberi ponudu</div>
                </div>
              </div>
            </div>`;
      }
      console.log(body);
    });
  });
};
k1_preuzmi();

let k2_odaberiDestinaciju = (rb) => {
  let nizPutovanja = globalPodaci[rb].planiranaPutovanja;
  document.getElementById("destinacija").value = globalPodaci[rb].drzava;
  document.getElementById("putovanjaTabela").innerHTML = "";
  for (let i = 0; i < nizPutovanja.length; i++) {
    document.getElementById("putovanjaTabela").innerHTML += `
    <tr class="putovanje-red" id="putovanje-red-${i}">
      <td>${nizPutovanja[i].idPutovanje}</td>
      <td>${nizPutovanja[i].datumPol}</td>
      <td>${nizPutovanja[i].datumPov}</td>
      <td>${nizPutovanja[i].countSlobodnoMjesta}</td>
      <td>${nizPutovanja[i].cijenaPoOsobiEur}</td>
      <td><button onclick="k3_odaberiPutovanje()">K3 Odaberi</button></td>
    </tr>
    `;
  }
};

let k3_odaberiPutovanje = () => {

};

let ErrorBackgroundColor = "#FE7D7D";
let OkBackgroundColor = "#DFF6D8";

let k4_promjenaBrojaGostiju = () => {

};

let k5_posalji = () => {
  //https://wrd-api.fit.ba/ -> Ispit20250906 -> Add

  let frontendGreskeValidacije = "";
  frontendGreskeValidacije += provjeriBrojTelefona();//itd. ostale frontend provjere

  if (frontendGreskeValidacije != "") {
    messageDanger("Frontend validacija: <br/><br/>" + frontendGreskeValidacije); //ispis grešaka iz frontend validacije
    return;
  }

  let obj = {};


  //nastavak code-a iz k5_posalji ne treba mijenjati
  fetch("https://wrd-api.fit.ba/Ispit20250906/Dodaj", {
    method: "POST",
    body: JSON.stringify(obj),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    res.json().then((body) => {
      if (body.brojGresaka == 0){
      dialogSuccess(
        "Uspješno kreirana rezervacija sa brojem : " + body.idRezervacije
      );
    }
    else{
      let backendGreskeValidacije =  body.spisakGresaka.join("<br/>");
      messageDanger("Backend validacija: Poslati json podaci nisu ispravni.<br/><br/>" + backendGreskeValidacije); //ispis grešaka iz backend validacije
    }
    });
  });
};

let provjeriBrojGostiju = () => {

};
let provjeriPasos = () => {

};
let provjeriDatum = () => {

};

//Primjer regex-a
let provjeriBrojTelefona = () => {
  if (!/^\d{3}-\d{3}-\d{3}$/.test(document.getElementById("phone").value)) {
    document.getElementById("phone").style.backgroundColor = ErrorBackgroundColor;
    return "Neispravan broj telefona\n"; //vratiti poruke greske frontend validacije
  } else {
    document.getElementById("phone").style.backgroundColor = OkBackgroundColor;
    return ""; //vratiti prazan string ako nema greške
  }
};



