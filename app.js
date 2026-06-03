const OPENROUTER_API_KEY = "";
const couleurs = {

    "Amélioration": {
        bg: "#e6f9f0",
        text: "#27ae60"
    },

    "Problème": {
        bg: "#fdecea",
        text: "#e74c3c"
    },

    "Innovation": {
        bg: "#eaf0ff",
        text: "#2980b9"
    },

    "Feedback": {
        bg: "#f3eeff",
        text: "#8e44ad"
    },

    "Projet": {
        bg: "#fffbe6",
        text: "#f39c12"
    },

    "Autre": {
        bg: "#f0f0f0",
        text: "#555"
    }

};
const loader = document.getElementById("loader");
// On récupère le conteneur des cartes
const container = document.querySelector(".row.g-3");
//récupérer les anciennes données
let idees = JSON.parse(localStorage.getItem("idees")) || [];
let categorieActive = "Toutes";
//addEventListener permet d’écouter un événement
//"DOMContentLoaded" est un événement déclenché quand :le HTML est complètement chargé
window.addEventListener("DOMContentLoaded", ()=>{
    afficherIdees(),
    updateCategoriesUI(),
    countIdee()
});

const searchInput = document.querySelector("#searchInput");
//"input" est un type d’événement qui signifie : “à chaque fois que l’utilisateur tape quelque chose dans un champ”
searchInput.addEventListener("input", function () {
    afficherIdees(this.value);
});

function countIdee(){
    document.querySelector("#totalIdees").textContent =`${idees.length} idées publiées`;
}

function filtrerIdee(){

    //récupèrer toutes les li 
    const liCategories = document.querySelectorAll(".categorie-item");

    liCategories.forEach(cat=>{
        cat.addEventListener("click",()=>{

            // enlever active partout
            liCategories.forEach(item => {
                item.classList.remove("active-categorie");
            });

            // ajouter active sur élément cliqué
            cat.classList.add("active-categorie");
            cat.classList.remove("colorText")

            // récupérer catégorie
            categorieActive = cat.dataset.category;
            afficherIdees(searchInput.value)
        });
    });
}
filtrerIdee()

//compter les idées par catégorie
function updateCategoriesUI() {

    const categories = {
        "Innovation": 0,
        "Amélioration": 0,
        "Problème": 0,
        "Projet": 0,
        "Feedback": 0,
        "Autre": 0
    };

    idees.forEach(idee => {
        if (categories[idee.categorie] !== undefined) {
            categories[idee.categorie]++;
        }
    });

    // total
    document.querySelector("#count-all").textContent = idees.length;

    // catégories
    document.querySelector("#count-innovation").textContent = categories["Innovation"];
    document.querySelector("#count-amelioration").textContent = categories["Amélioration"];
    document.querySelector("#count-probleme").textContent = categories["Problème"];
    document.querySelector("#count-projet").textContent = categories["Projet"];
    document.querySelector("#count-feedback").textContent = categories["Feedback"];
    document.querySelector("#count-autre").textContent = categories["Autre"];
}

function afficherIdees(search = "") {

    container.innerHTML = ""; // vider avant affichage

    let ideesToShow = [...idees];

    // SI ce n'est pas "Toutes" → filtrer
    if (categorieActive !== "Toutes") {
        ideesToShow = ideesToShow.filter(idee => idee.categorie === categorieActive);
    }

     // RECHERCHE
     //on exécute la recherche seulement si l’utilisateur a vraiment tapé quelque chose
    if (search.trim() !== "") {

        ideesToShow = ideesToShow.filter(idee =>
            idee.titre.toLowerCase().includes(search.toLowerCase())
        );
    }

    ideesToShow.forEach(idee => {

        //récupérer la couleur de la categorie
        const couleur = couleurs[idee.categorie];
        
        const col = document.createElement("div");
        //classList représente la liste des classes CSS d’un élément.
        col.classList.add("col-6");

        // Construire le contenu de la carte
        //innerHTML sert à lire ou modifier le contenu HTML à l’intérieur d’un élément.
        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge rounded-pill" style="background-color:${couleur.bg}; color:${couleur.text};">${idee.categorie}</span>
                    <small class="text-muted">${idee.date}</small>
                </div>
                <h6 class="fw-bold mb-1">${idee.titre}</h6>
                <p class="text-muted small mb-2">${idee.description}</p>
                <div class="d-flex gap-2">

                    <button class="btn btn-sm btn-outline-primary" onclick="modifierIdee(${idee.id})">
                        Modifier
                    </button>

                    <button class="btn btn-sm btn-outline-danger" onclick="supprimerIdee(${idee.id})">
                        Supprimer
                    </button>

                </div>
            </div>
        `;

        // Ajouter la carte dans le container
        container.appendChild(col);
    });
}

// Quand on clique sur publier; "submit" est l’événement envoyé quand un formulaire est soumis.
document.querySelector("form").addEventListener("submit", async function(e) {
    //Empêche le comportement normal du formulaire comme: l'envoie automatique des données du formulaire et le rechargement de la page
    e.preventDefault();
    try{
        loader.style.display = "block";
        // Récupérer les valeurs du formulaire
        const titre = document.querySelector("#titre").value;
        //const categorie = document.querySelector("#categorie").value;
        const description = document.querySelector("#description").value;
        const date = new Date().toLocaleDateString("fr-FR");

        const categorie = await detectCategory(titre, description);
        console.log("Catégorie reçue :", categorie);
    

        //MODIFICATION
        if (ideeEnModification !== null) {

            idees = idees.map(idee => {

                if (idee.id === ideeEnModification) {
                    return {
                        ...idee,
                        titre,
                        categorie,
                        description
                    };
                }

                return idee;
            });

            ideeEnModification = null; // reset

        }else{

            const nouvelleIdee = {
                id: Date.now(),
                titre,
                description,
                categorie,
                date
            };

            idees.push(nouvelleIdee);
            localStorage.setItem("idees", JSON.stringify(idees));

            // optionnel: reset formulaire
            document.querySelector("form").reset();
        }

    }catch (error) {
        console.log(error);
        alert("Erreur lors de la classification de l'idée.");
    } finally {
        loader.style.display = "none";
    }

    // optionnel: rafraîchir affichage
    afficherIdees(searchInput.value);
    updateCategoriesUI();
    countIdee();
  
});

//ça sert à savoir si on est en mode "ajout" ou "modification"
let ideeEnModification = null;
window.modifierIdee = function(id){
    const idee=idees.find(idee=>id===idee.id)
    if (idee){
        document.querySelector("#titre").value = idee.titre;
        document.querySelector("#description").value = idee.description;
        document.querySelector("#categorie").value = idee.categorie;
        ideeEnModification = id;
    }
}

window.supprimerIdee = function(id){
    const idee=idees.find(idee=>id===idee.id)
    if (idee){
        idees=idees.filter(idee=>idee.id!==id)
        localStorage.setItem("idees", JSON.stringify(idees));
        afficherIdees(searchInput.value)
        updateCategoriesUI()
        countIdee()
    }
}

async function detectCategory(title, description) {
const prompt = `
Tu es un système de classification STRICT.

Tu dois choisir UNE SEULE catégorie parmi cette liste EXACTE :

- Amélioration
- Problème
- Innovation
- Feedback
- Projet
- Autre

RÈGLES ABSOLUES :
- Réponds uniquement par UN seul mot ou expression EXACTE de la liste ci-dessus
- Respecte les majuscules et accents exactement comme écrits
- Interdiction totale d’ajouter du texte
- Interdiction d’expliquer
- Interdiction de ponctuation
- Interdiction de variation (ex: "probleme", "Problèmes", etc. sont interdits)

EXEMPLES :

Titre: Application lente
Réponse: Problème

Titre: Nouvelle fonctionnalité IA
Réponse: Innovation

Titre: Correction bug interface
Réponse: Amélioration

---

Maintenant classe cette idée :

Titre : ${title}
Description : ${description}

Réponse :
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        {
            role: "user",
            content: prompt
        }
    ],
    "reasoning": {"enabled": true}
    }),
  });

  console.log(response);
  

  const data = await response.json();

    console.log(data);

    const category = data.choices[0].message.content;

    return category




}
