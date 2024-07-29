window.onload = async function loadData() {
    try {
        const response = await fetch('/data.json');
        const jsonData = await response.json();
        const container = document.getElementById('container');
        const template = document.getElementById('skillCardTemplate');
        for (const skill of jsonData.techinical_skills) {
            const newElement = template.cloneNode(true);
            newElement.id = skill.name;
            newElement.querySelector('.skillCardFooter p').textContent = skill.name;

            const cardContent = newElement.querySelector('.skillCardContent');
            cardContent.innerHTML = '';

            for (let i = 0; i < skill.level; i++) {
                const dot = document.createElement('div');
                dot.classList.add('skillCardDot');
                cardContent.appendChild(dot);
            }
            for (let i = skill.level; i < 5; i++) {
                const dotEmpty = document.createElement('div');
                dotEmpty.classList.add('skillCardEmptyDot');
                cardContent.appendChild(dotEmpty);
            }
            container.appendChild(newElement);
        }
        container.removeChild(template);
        if (document.getElementById("smallProfileImage")) {
            document.getElementById("smallProfileImage").src = jsonData.profileImage;
        }
    } catch (erro) {
        console.error('Erro ao carregar o JSON:', erro);
    }
}