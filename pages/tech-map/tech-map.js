window.onload = function () {
    const images = document.querySelectorAll('.skillIcon');
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const maxPositionTop = 140;
        const maxPositionLeft = 140;
        const randomPositionTop = Math.floor(Math.random() * maxPositionTop) * (Math.random() < 0.5 ? -1 : 1);
        const randomPositionLeft = Math.floor(Math.random() * maxPositionLeft) * (Math.random() < 0.5 ? -1 : 1);
        image.style['padding-top'] = `${randomPositionTop}px`;
        image.style['padding-left'] = `${randomPositionLeft}px`;
    }
    updateProfileImage();
}

async function updateProfileImage() {
    try {
        const response = await fetch('/data.json');
        const jsonData = await response.json();
        if (document.getElementById("smallProfileImage")) {
            document.getElementById("smallProfileImage").src = jsonData.profileImage;
        }
    } catch (erro) {
        console.error('Erro ao carregar o JSON:', erro);
    }
}