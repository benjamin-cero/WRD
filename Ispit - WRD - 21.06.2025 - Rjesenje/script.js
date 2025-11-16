let nazivdrzave;
let globalPodaci = [];
let k1_preuzmi = () => {
  //od 22.06.2025. koristi se adresa servera "wrd-api.fit.ba" umjesto "wrd-fit.info"
  fetch(`https://wrd-api.fit.ba/Ispit20250621/GetNovePonude`).then((res) => {
    res.json().then((body) => {
      globalPodaci = body.podaci;
      for (let i = 0; i < globalPodaci.length; i++) {
        document.getElementById("destinacije").innerHTML += `
                <div class="best-offer-wrapper">
              <div class="offer-akcija">${globalPodaci[i].akcijaPoruka}</div>
              <div class="best-offer">
                <div class="offer-header">
                  <img src="${globalPodaci[i].slikaUrl}"/>
                </div>
                <div class="offer-content-wrapper">
                <div class="offer-content">
                  <h2>${globalPodaci[i].drzava}</h2>
                  <p>${globalPodaci[i].opisPonude}</p>
                  <div class="offer-date">
                    <div>Datum polaska:</div>
                    <div>${globalPodaci[i].naredniPolazak.datumPol}</div>
                  </div>
                  <div class="offer-price">
                    <div>Cijena:</div>
                    <div>${globalPodaci[i].naredniPolazak.cijenaPoOsobiEur}$</div>
                  </div>
                </div>
                <div class="offer-button" onclick="k2_odaberiDestinaciju(${i})">K2 Odaberi ponudu</div>
                </div>
              </div>
            </div>`;
      }
      const ponude = document.querySelectorAll('.best-offer-wrapper');
      ponude.forEach(x=>{
        const btn = x.querySelector('.offer-button');
        btn.addEventListener('click', ()=>{
          ponude.forEach(o=> o.style.border = '1px solid grey');
          x.style.border = '2px solid yellow';
                    const drzava = x.querySelector('.offer-content h2').textContent;

          nazivdrzave = drzava;
        });

      });

      
      

      document.querySelector('.search-button').addEventListener('click', ()=>{
        const ime = document.querySelector('.search-bar input').value.toLowerCase();

        ponude.forEach(x=>{
          const drzava = x.querySelector('.offer-content h2').textContent.toLowerCase();
          if(ime == "", drzava.includes(ime)){
            x.style.display = 'block';
          }else{
            x.style.display = 'none';
          }


        });
      })


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
    <tr class="putovanje-red" id="putovanje-red-${i}" draggable="true" ondragstart="dragstartHandler(event,${i})">
      <td>${nizPutovanja[i].idPutovanje}</td>
      <td>${nizPutovanja[i].datumPol}</td>
      <td>${nizPutovanja[i].datumPov}</td>
      <td>${nizPutovanja[i].countSlobodnoMjesta}</td>
      <td>${nizPutovanja[i].cijenaPoOsobiEur}</td>
      <td><button onclick="k3_odaberiPutovanje(this)">K3 Odaberi</button></td>
    </tr>
    `;
  }
};
let putid;

let k3_odaberiPutovanje = (button) => {
const row = button.closest('.putovanje-red');
let column = row.getElementsByTagName('td');
document.getElementById('datumPolaska').value = column[1].textContent;
document.getElementById('cijenaPoGostu').value = column[4].textContent;
putid =column[0].textContent;
document.getElementById('destinacija').value = nazivdrzave;
const brgostiju = document.getElementById('brojGostiju').value;
document.getElementById('ukupnaCijena').value = brgostiju * document.getElementById('cijenaPoGostu').value;
};

let ErrorBackgroundColor = "#FE7D7D";
let OkBackgroundColor = "#DFF6D8";

let k4_promjenaBrojaGostiju = () => {
const brgostiju = document.getElementById('brojGostiju').value;
const cijenapg = document.getElementById('cijenaPoGostu').value;
const gosti = document.getElementById('gosti');
gosti.innerHTML = "";

for (let index = 0; index < brgostiju; index++) {
  let input = document.createElement('input');
  input.type= 'text';
  gosti.appendChild(input);
}
document.getElementById('ukupnaCijena').value = brgostiju * cijenapg;



};

let k5_posalji = () => {
  //https://wrd-api.fit.ba/ -> Ispit20250621 -> Add

  if (!provjeriBrojPutnika()) {
    messageSuccess("Broj putnika neispravan");
    return;
  }
  if (!provjeriIme()) {
    messageSuccess("Broj putnika neispravan");
    return;
  }
  if (!provjeriPasos()) {
    messageSuccess("Broj putnika neispravan");
    return;
  }
  if (!provjeriEmail()) {
    messageSuccess("Broj putnika neispravan");
    return;
  }

  let obj ={
putovanjeID: putid,
  drzavaNaziv: document.getElementById('destinacija').value,
  brojTelefona: document.getElementById('phone').value,
  datumPolaska: document.getElementById('datumPolaska').value,
  cijenaUkupno: parseInt(document.getElementById('ukupnaCijena').value),
  gostiPutovanja: [... document.querySelectorAll('#gosti input')].map(x=> x.value.trim()).filter(x=> x!=""),
  brojPasosa: document.getElementById("brojPasosa").value,
  emailAdresa: document.getElementById("email").value,
  datumVazenjaPasosa: document.getElementById('datumVazenjaPasosa').value
  };
  //od 22.06.2025. koristi se adresa servera "wrd-api.fit.ba" umjesto "wrd-fit.info"
  fetch("https://wrd-api.fit.ba/Ispit20250621/Dodaj", {
    method: "POST",
    body:JSON.stringify(obj) , //ovdje postaviti body
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    res.json().then((body) => {
      dialogSuccess(
        "Uspješno kreirana rezervacija sa brojem : " + body.idRezervacije
      );
    });
  });
};

let provjeriBrojPutnika = () =>{
if (document.getElementById("brojGostiju").value<2) {
    document.getElementById("brojGostiju").style.backgroundColor =
      ErrorBackgroundColor;
    return false;
  } else {
    document.getElementById("brojGostiju").style.backgroundColor =
      OkBackgroundColor;
    return true;
  }
};
/*2.	Ime i prezime putnika
o	dvije riječi engleske abecede (A-Z).
o	riječi počinju velikim slovom i moraju sadržati barem tri slova
 */

let provjeriIme = () => {
  const gosti = document.getElementById('gosti');
    const input = gosti.querySelectorAll('input');
  let provjera = true;
  const regex = /^[A-Z][a-z]{3,}\s[A-Z][a-z]{3,}$/;
  input.forEach(x=>{
    if(!regex.test(x.value.trim())){
      provjera = false;
      x.style.backgroundColor = ErrorBackgroundColor;
    }else{
            x.style.backgroundColor = OkBackgroundColor;

    }
  })
  return provjera;
};
/*3.	Broj pasoša 
o	Prva tri znaka su velika slova engleske abecede (A-Z).
o	Slijedi jedna cifra (0-9).
o	Zatim dolaze dva velika slova u rasponu od A do D.
o	Nakon toga slijedi još jedna cifra (0-9).
o	Nakon toga slijedi srednja crtica „-“
o	Broj pasoša završava s jednom cifrom između 1 i 5.

}; */
let provjeriPasos = () => {
if (!/^[A-Z]{3}[0-9][A-D]{2}[0-9]-[1-5]$/.test(document.getElementById("brojPasosa").value)) {
    document.getElementById("brojPasosa").style.backgroundColor =
      ErrorBackgroundColor;
    return false;
  } else {
    document.getElementById("brojPasosa").style.backgroundColor =
      OkBackgroundColor;
    return true;
  }
};
/*o	riječ engleske abecede
o	zatim slijedi „.“ ili „_“
o	zatim ponovno riječ engleske abecede
o	zatim „@“
o	zatim jedna od domena („gmail.com“ ili „edu.fit.ba“)
	adil.joldic@gmail.com 
	adil_joldic@edu.fit.ba
 */
let provjeriEmail = () => {
if (!/^[a-z]+[\.-][a-z]+@(gmail.com|edu.fit.ba)$/.test(document.getElementById("email").value)) {
    document.getElementById("email").style.backgroundColor =
      ErrorBackgroundColor;
    return false;
  } else {
    document.getElementById("email").style.backgroundColor =
      OkBackgroundColor;
    return true;
  }

};
let provjeriPrimjer = () => {
  //ovo treba obrisati
  if (!/^IB[0-9]{6}$/.test(document.getElementById("brojPasosa").value)) {
    document.getElementById("brojPasosa").style.backgroundColor =
      ErrorBackgroundColor;
    return false;
  } else {
    document.getElementById("brojPasosa").style.backgroundColor =
      OkBackgroundColor;
    return true;
  }
};

function dragstartHandler(ev,i) {
  ev.dataTransfer.setData("text",i);
}

function dragoverHandler(ev) {
  ev.preventDefault();
}

function dropHandler(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  let row = document.getElementById(`putovanje-red-${data}`);
  document.getElementById('datumPolaska').value = row.children[1].textContent;
document.getElementById('cijenaPoGostu').value = row.children[4].textContent;
const brgostiju = document.getElementById('brojGostiju').value;
document.getElementById('ukupnaCijena').value = brgostiju * document.getElementById('cijenaPoGostu').value;
pong('datumPolaska');
pong('cijenaPoGostu');
}

function pong(id){
  const an = document.getElementById(id);
  an.classList.add("pong");
  setTimeout(() => an.classList.remove("pong"), 1500);
}