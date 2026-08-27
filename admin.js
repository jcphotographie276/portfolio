import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    orderBy
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


import { initializeApp }
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";


import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";





const firebaseConfig = {
  apiKey: "AIzaSyCf7-hELe7UTM4qRrSP-BTFeySo2Zk_678",
  authDomain: "jade-photographie.firebaseapp.com",
  projectId: "jade-photographie",
  storageBucket: "jade-photographie.firebasestorage.app",
  messagingSenderId: "774610773034",
  appId: "1:774610773034:web:6b1d57344eaa65dadf4f53",
  measurementId: "G-8CWVK4JRY5"
};






const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);








// ELEMENTS LOGIN


const email = document.getElementById("email");

const password = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");

const logoutBtn = document.getElementById("logoutBtn");

const loginBox = document.getElementById("loginBox");

const adminPanel = document.getElementById("adminPanel");

const message = document.getElementById("message");








// ELEMENTS UPLOAD


const photoFile = document.getElementById("photoFile");

const photoTitle = document.getElementById("photoTitle");

const photoCategory = document.getElementById("photoCategory");

const uploadBtn = document.getElementById("uploadBtn");

const uploadMessage = document.getElementById("uploadMessage");

const imagePreview = document.getElementById("imagePreview");








// ELEMENTS GALERIE


const manageCategory = document.getElementById("manageCategory");

const previewGallery = document.getElementById("previewGallery");








// APERCU IMAGE AVANT UPLOAD


photoFile.addEventListener("change",()=>{


const file = photoFile.files[0];


if(!file){

imagePreview.style.display="none";

return;

}



const url = URL.createObjectURL(file);


imagePreview.src=url;

imagePreview.style.display="block";


});








// CHARGEMENT GALERIE


manageCategory.addEventListener(
"change",
chargerGalerie
);








window.garantirOrdres = async function(categorie){

    const q = query(
        collection(db, "photos"),
        where("categorie", "==", categorie)
    );

    const result = await getDocs(q);
    const photos = [];

    result.forEach((docSnapshot) => {
        photos.push({
            id: docSnapshot.id,
            ...docSnapshot.data()
        });
    });

    const photosOrdonnees = photos
        .map((photo) => ({
            ...photo,
            ordre: typeof photo.ordre === "number" ? photo.ordre : Number.MAX_SAFE_INTEGER
        }))
        .sort((a, b) => a.ordre - b.ordre || (a.createdAt || 0) - (b.createdAt || 0));

    for (let index = 0; index < photosOrdonnees.length; index += 1) {
        const photo = photosOrdonnees[index];
        if (photo.ordre !== index + 1) {
            await updateDoc(doc(db, "photos", photo.id), {
                ordre: index + 1
            });
        }
    }
};

async function chargerGalerie(){


try{


previewGallery.innerHTML="Chargement...";


const categorie = manageCategory.value;

await garantirOrdres(categorie);

const q = query(

collection(db,"photos"),

where(
"categorie",
"==",
categorie
),

orderBy(
"ordre",
"asc"
)

);



const result = await getDocs(q);



previewGallery.innerHTML="";



if(result.empty){

previewGallery.innerHTML=
"Aucune photo dans cette catégorie.";

return;

}





let photos=[];


result.forEach(photo=>{


photos.push({

id:photo.id,

...photo.data()

});


});





photos.forEach((photo,index)=>{



previewGallery.innerHTML += `


<div class="photo-admin-card">


<img src="${photo.url}">



<input
type="text"
id="titre-${photo.id}"
value="${photo.titre || ""}"
>



<div class="photo-actions">



<button onclick="modifierTitre('${photo.id}')">

💾

</button>




<button onclick="monterPhoto(${index})">

⬆️

</button>




<button onclick="descendrePhoto(${index})">

⬇️

</button>




<button onclick="supprimerPhoto('${photo.id}')">

🗑️

</button>



</div>



</div>


`;



});





window.photosActuelles = photos;



}

catch(error){


console.error(error);


previewGallery.innerHTML =
"Erreur : " + error.message;


}



}









// CONNEXION


loginBtn.addEventListener("click",()=>{


signInWithEmailAndPassword(

auth,

email.value,

password.value

)


.then(()=>{

message.textContent="Connexion réussie";

})


.catch(error=>{


console.error(error);


message.textContent =
"Erreur : " + error.code;


});


});








// VERIFICATION SESSION


onAuthStateChanged(auth,(user)=>{


if(user){


loginBox.style.display="none";


adminPanel.style.display="block";


chargerGalerie();


}


else{


loginBox.style.display="block";


adminPanel.style.display="none";


}



});








// DECONNEXION


logoutBtn.addEventListener("click",()=>{


signOut(auth);


});








// UPLOAD PHOTO


uploadBtn.addEventListener("click",async()=>{



const file = photoFile.files[0];



if(!file){

uploadMessage.textContent=
"Choisis une image.";

return;

}



uploadMessage.textContent=
"Envoi en cours...";





try{



const formData = new FormData();


formData.append(
"file",
file
);



formData.append(
"upload_preset",
"jade_photos"
);





const response = await fetch(

"https://api.cloudinary.com/v1_1/afkcpdrb/image/upload",

{

method:"POST",

body:formData

}

);





const data = await response.json();





const q = query(

collection(db,"photos"),

where(
"categorie",
"==",
photoCategory.value
)

);



const existantes = await getDocs(q);





await addDoc(

collection(db,"photos"),

{


titre:photoTitle.value,


categorie:photoCategory.value,


url:data.secure_url,


ordre:existantes.size + 1,


createdAt:Date.now()


}

);





uploadMessage.textContent=
"✅ Photo publiée";





photoTitle.value="";

photoFile.value="";

imagePreview.style.display="none";



chargerGalerie();



}



catch(error){


console.error(error);


uploadMessage.textContent=
"Erreur pendant l'envoi.";


}



});









// MODIFIER TITRE


window.modifierTitre = async(id)=>{


const valeur =
document.getElementById(
"titre-"+id
).value;



await updateDoc(

doc(db,"photos",id),

{

titre:valeur

}

);



chargerGalerie();


};









// SUPPRIMER


window.supprimerPhoto = async(id)=>{


if(confirm("Supprimer cette photo ?")){


await deleteDoc(

doc(db,"photos",id)

);



chargerGalerie();


}



};









// MONTER PHOTO


window.monterPhoto = async(index)=>{


if(index===0)
return;



const photos = window.photosActuelles;



const actuelle = photos[index];

const precedente = photos[index-1];





await updateDoc(

doc(db,"photos",actuelle.id),

{

ordre:precedente.ordre

}

);



await updateDoc(

doc(db,"photos",precedente.id),

{

ordre:actuelle.ordre

}

);



chargerGalerie();


};









// DESCENDRE PHOTO


window.descendrePhoto = async(index)=>{


const photos = window.photosActuelles;



if(index===photos.length-1)
return;





const actuelle = photos[index];

const suivante = photos[index+1];





await updateDoc(

doc(db,"photos",actuelle.id),

{

ordre:suivante.ordre

}

);



await updateDoc(

doc(db,"photos",suivante.id),

{

ordre:actuelle.ordre

}

);



chargerGalerie();


};