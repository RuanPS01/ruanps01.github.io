window.onload = async function loadData() {
    try {
        const response = await fetch('/data.json');
        const jsonData = await response.json();
        const container = document.getElementById('container');
        const template = `
            <span class="tag">
                <h3>{{interest}}</h3>
            </span>
        `;
        container.innerHTML = '';
        jsonData.interests.forEach(interest => {
            const newElement = document.createElement('div');
            newElement.innerHTML = template.replace(/{{(.*?)}}/g, (_, keyToReplace) => {
                if (keyToReplace.trim() === 'interest') {
                    return interest;
                }
                return '';
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