window.onload = async function loadData() {
    try {
        const response = await fetch('/data.json');
        const jsonData = await response.json();
        const container = document.getElementById('container');
        const template = container.innerHTML;
        container.innerHTML = '';
        jsonData.experience.forEach(item => {
            const newElement = document.createElement('div');
            newElement.innerHTML = template.replace(/{{(.*?)}}/g, (_, keyToReplace) => {
                if (keyToReplace.trim() === 'description') {
                    const newDescription = `${item[keyToReplace.trim()]}<br><br>Palavras-chave:<br>${item.keywords.join(', ')}`;
                    return newDescription;
                } else if (keyToReplace.trim() === 'images') {
                    const imagesDiv = document.createElement('div');
                    imagesDiv.id = 'itemImages';
                    item.images.forEach(image => {
                        const img = document.createElement('img');
                        img.className = 'itemImage';
                        img.src = image;
                        imagesDiv.appendChild(img);
                    });
                    return imagesDiv.outerHTML;
                } else if (keyToReplace.trim() === 'icons') {
                    const iconsDiv = document.createElement('div');
                    iconsDiv.id = 'techIcons';
                    item.icons.forEach(icon => {
                        const img = document.createElement('img');
                        img.className = 'techIcon';
                        img.src = icon;
                        iconsDiv.appendChild(img);
                    });
                    return iconsDiv.outerHTML;
                } else {
                    return item[keyToReplace.trim()];
                }
            });

            container.appendChild(newElement);
        });
        if (document.getElementById("smallProfileImage")) {
            document.getElementById("smallProfileImage").src = jsonData.profileImage;
        }
    } catch (erro) {
        console.error('Erro ao carregar o JSON:', erro);
    }
}