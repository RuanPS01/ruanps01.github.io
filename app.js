function goTo(route) {
    window.location.href = route;
}

function sendMessage() {
    const name = document.getElementById("name").value;
    const message = document.getElementById("message").value;
    const apiUrl = `https://api.whatsapp.com/send?phone=5524981140105&text=${encodeURIComponent(`Olá meu nome é ${name}. \n${message}`)}`;
    window.open(apiUrl);
}

function sendMessageMobile() {
    const name = document.getElementById("nameMobile").value;
    const message = document.getElementById("messageMobile").value;
    const apiUrl = `https://api.whatsapp.com/send?phone=5524981140105&text=${encodeURIComponent(`Olá meu nome é ${name}. \n${message}`)}`;
    window.open(apiUrl);
}

function copyToClipboard(stringToCopy) {
    navigator.clipboard.writeText(stringToCopy);
}

function showHome() {
    window.location.href = "/index.html";
}

async function loadData() {
    try {
        const response = await fetch('/data.json');
        const jsonData = await response.json();
        const body = document.getElementsByTagName('body')[0];
        body.innerHTML = body.innerHTML.toString().replace(/{{(.*?)}}/g, (_, keyToReplace) => {
            return jsonData[keyToReplace.trim()];
        });

        const profileImages = document.querySelectorAll('.profileImage');
        profileImages.forEach((img) => {
            img.src = jsonData.profileImage;
        });
        const githubs = document.querySelectorAll('.github');
        githubs.forEach((link) => {
            link.href = jsonData.github;
        });
        const linkedins = document.querySelectorAll('.linkedin');
        linkedins.forEach((link) => {
            link.href = jsonData.linkedin;
        });

    } catch (erro) {
        console.error('Erro ao carregar o JSON:', erro);
    }
}


function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

window.onload = function onLoad() {
    const desktop = document.getElementById("desktop");
    const mobile = document.getElementById("mobile");
    if (isMobile()) {
        desktop.style.display = "none";
        mobile.style.display = "block";
        loadData();
    } else {
        desktop.style.display = "block";
        mobile.style.display = "none";
        loadData();
    }
}


window.addEventListener('scroll', function () {
    if (window.scrollY > 0) {
        document.getElementById("smallProfileImage").style.opacity = "0";
    } else {
        document.getElementById("smallProfileImage").style.opacity = "1";
    }
});