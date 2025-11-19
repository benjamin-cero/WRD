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
                  <img src = "${globalPodaci[i].slikaUrl}" />


                </div>
                <div class="offer-button" onclick="k2_odaberiDestinaciju(${i})">K2 Odaberi ponudu</div>
                </div>
              </div>
            </div>`;
      }
      const ponude = document.querySelectorAll('.best-offer-wrapper');
      ponude.forEach(x=> {
        x.addEventListener('mouseover', ()=>{
          x.style.backgroundColor = 'rgba(192, 192, 192, 0.582)';
        });
         x.addEventListener('mouseout', ()=>{
          x.style.backgroundColor = 'white';
        });
      });

      
      
      
      const btn = document.querySelector('.search-button');
      btn.addEventListener('click', ()=>{
        const pretraga = document.querySelector('.search-bar input').value.toLowerCase();
        ponude.forEach(x=>{
          const drzava = x.querySelector('.offer-details h2').textContent.toLowerCase();
          if(pretraga == '' || drzava.includes(pretraga)){
            x.style.display = 'block';
          }else{
            x.style.display = 'none';
          }

        });

      });


      

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
let pb;
let k3_odaberiPutovanje = (button) => {
  const row = button.closest('.putovanje-red');
  let column = row.getElementsByTagName('td');
  document.getElementById('datumPolaska').value = column[1].textContent;
    document.getElementById('cijenaPoGostu').value = column[4].textContent;
    pb = column[0].textContent;

    const brGostiju = document.getElementById('brojGostiju').value;

document.getElementById('ukupnaCijena').value = brGostiju * column[4].textContent;

bom('cijenaPoGostu');
bom('datumPolaska');
};

let ErrorBackgroundColor = "#FE7D7D";
let OkBackgroundColor = "#DFF6D8";

let k4_promjenaBrojaGostiju = () => {
const gosti = document.getElementById('gosti');
    const brGostiju = document.getElementById('brojGostiju').value;
    const cijena = document.getElementById('cijenaPoGostu').value;

    gosti.innerHTML = "";
    for (let index = 1; index <= brGostiju; index++) {
      let input = document.createElement('input');
      input.type = 'text';
      gosti.appendChild(input);
    }
    document.getElementById('ukupnaCijena').value = brGostiju * cijena;

};

let k5_posalji = () => {
  //https://wrd-api.fit.ba/ -> Ispit20250906 -> Add

  let frontendGreskeValidacije = "";
  frontendGreskeValidacije += provjeriBrojTelefona();//itd. ostale frontend provjere
    frontendGreskeValidacije += provjeriBrojGostiju();//itd. ostale frontend provjere
      frontendGreskeValidacije += provjeriPasos();//itd. ostale frontend provjere
  frontendGreskeValidacije += provjeriEmail();//itd. ostale frontend provjere


  if (frontendGreskeValidacije != "") {
    messageDanger("Frontend validacija: <br/><br/>" + frontendGreskeValidacije); //ispis grešaka iz frontend validacije
    return;
  }

  let obj = {
  putovanjeBroj: pb,
  destinacijaDrzava: document.getElementById('destinacija').value,
  datumPolaska: document.getElementById('datumPolaska').value,
  cijenaUkupno: document.getElementById('cijenaPoGostu').value,
  imenaGostiju:[... document.querySelectorAll('#gosti input')].map(x=> x.value.trim()).filter(x=> x!= ""),
  brojPasosa: document.getElementById("brojPasosa").value,
  emailAdresa: document.getElementById("email").value
  };


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
 if (document.getElementById("brojGostiju").value < 2 || document.getElementById("brojGostiju").value > 5) {
    document.getElementById("brojGostiju").style.backgroundColor = ErrorBackgroundColor;
    return "Neispravan broj gostiju\n"; //vratiti poruke greske frontend validacije
  } else {
    document.getElementById("brojGostiju").style.backgroundColor = OkBackgroundColor;
    return ""; //vratiti prazan string ako nema greške
  }
};
/*2.	Broj pasoša  
Prvi znak je veliko slovo engleske abecede „A do „Z“.  
Slijedi obavezno: jedna cifra (0-3).  
Slijedi opcionalno: srednja crtica „-“ . 
Slijedi obavezno: tri mala slova u rasponu od „a“ do „g“. 
Slijedi obavezno: dvije cifre (0-9). 
Slijedi obavezno: srednja crtica „-“ . 
Slijedi obavezno: dva velika slova u rasponu od „A“ do „F“. 
Primjeri validnog izraza: 
•	B2cfa79-BC
•	B2-cfa79-BC
 */
let provjeriPasos = () => {
if (!/^[A-Z][0-3]-?[a-g]{3}[0-9]{2}-[A-F]{2}$/.test(document.getElementById("brojPasosa").value)) {
    document.getElementById("brojPasosa").style.backgroundColor = ErrorBackgroundColor;
    return "Neispravan broj pasosa\n"; //vratiti poruke greske frontend validacije
  } else {
    document.getElementById("brojPasosa").style.backgroundColor = OkBackgroundColor;
    return ""; //vratiti prazan string ako nema greške
  }
};
/*Prvo počinje 1 ili više slova engleske abecede a – z (mala slova) 
Slijedi opcionalno: „.“ ili „_“ 
Slijedi obavezno: 1 ili više slova engleske abecede a – z (mala slova) 
Sljedi obavezno: znak „@“ 
Slijedi domena prema sljedećem pravilu: 
▪	1 ili više slova engleske abecede a – z (mala slova) 
▪	slijedi opcionalno: „tacka“ i opet 1 ili više slova engleske abecede a – z (mala slova)
▪	slijedi obavezno: „tacka“ i opet 2 ili više slova engleske abecede a – z (mala slova)
 */
let provjeriEmail = () => {
if (!/^[a-z]+[\._][a-z]+@[a-z]+(\.[a-z]+)?\.[a-z]{2,}$/.test(document.getElementById("email").value)) {
    document.getElementById("email").style.backgroundColor = ErrorBackgroundColor;
    return "Neispravan email\n"; //vratiti poruke greske frontend validacije
  } else {
    document.getElementById("email").style.backgroundColor = OkBackgroundColor;
    return ""; //vratiti prazan string ako nema greške
  }
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

function dragstartHandler(ev,i) {
  ev.dataTransfer.setData("text",i);
}

function dragoverHandler(ev) {
  ev.preventDefault();
}

function dropHandler(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  const row = document.getElementById(`putovanje-red-${data}`);
    document.getElementById('datumPolaska').value = row.children[1].textContent;
    document.getElementById('cijenaPoGostu').value = row.children[4].textContent;
    const brGostiju = document.getElementById('brojGostiju').value;

document.getElementById('ukupnaCijena').value = brGostiju * row.children[4].textContent;
bom('cijenaPoGostu');
bom('datumPolaska');

}


function bom(id){
  const an = document.getElementById(id);
  an.classList.add("bouce");
  setTimeout(() => an.classList.remove("bouce"), 800);
}