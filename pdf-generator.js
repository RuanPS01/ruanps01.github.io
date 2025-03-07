// pdf-generator.js
// Verificar se o script está sendo carregado corretamente
console.log('PDF Generator script carregado!');

// Função para converter SVG para imagem PNG
async function convertSvgToImage(svgUrl) {
    return new Promise((resolve, reject) => {
        // Criar um elemento de imagem para carregar o SVG
        const img = new Image();
        img.onload = () => {
            try {
                // Criar um canvas para renderizar o SVG
                const canvas = document.createElement('canvas');
                const size = 24; // Tamanho padrão para ícones
                canvas.width = size;
                canvas.height = size;
                
                // Obter contexto e desenhar a imagem
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, size, size);
                
                // Fundo transparente
                ctx.fillStyle = 'rgba(0,0,0,0)';
                ctx.fillRect(0, 0, size, size);
                
                // Desenhar o SVG
                ctx.drawImage(img, 0, 0, size, size);
                
                // Converter para uma imagem PNG
                const pngImage = new Image();
                pngImage.onload = () => resolve(pngImage);
                pngImage.onerror = (e) => reject(new Error('Erro ao criar imagem PNG do SVG'));
                pngImage.src = canvas.toDataURL('image/png');
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error(`Falha ao carregar SVG: ${svgUrl}`));
        
        // SVGs podem precisar de tratamento especial para CORS
        img.crossOrigin = 'Anonymous';
        img.src = svgUrl;
    });
}

// Função para pré-carregar ícones de tecnologia, com suporte para SVG
async function preloadTechIcons(data) {
    const techIconsCache = {};
    
    // Coletar todos os caminhos de ícones de todas as fontes
    const iconPaths = new Set();
    
    // Experiências
    data.experience.forEach(exp => {
        if (exp.icons && Array.isArray(exp.icons)) {
            exp.icons.forEach(icon => iconPaths.add(icon));
        }
    });
    
    // Educação
    data.education.forEach(edu => {
        if (edu.icons && Array.isArray(edu.icons)) {
            edu.icons.forEach(icon => iconPaths.add(icon));
        }
    });
    
    // Projetos
    data.projects.forEach(proj => {
        if (proj.icons && Array.isArray(proj.icons)) {
            proj.icons.forEach(icon => iconPaths.add(icon));
        }
    });
    
    console.log(`Total de ${iconPaths.size} ícones para carregar`);
    
    // Carregar ícones em paralelo
    const loadPromises = Array.from(iconPaths).map(async path => {
        try {
            // Verificar se é um SVG
            if (path.toLowerCase().endsWith('.svg')) {
                // Converter SVG para imagem
                const icon = await convertSvgToImage(path);
                techIconsCache[path] = icon;
                console.log(`Ícone SVG convertido: ${path}`);
            } else {
                // Para outros formatos, carregar normalmente
                const icon = await loadImage(path);
                techIconsCache[path] = icon;
                console.log(`Ícone carregado: ${path}`);
            }
        } catch (e) {
            console.warn(`Falha ao carregar ícone: ${path}`, e);
        }
    });
    
    await Promise.all(loadPromises);
    console.log(`Pré-carregados ${Object.keys(techIconsCache).length} ícones de tecnologias`);
    
    return techIconsCache;
}

// Declarar a função no escopo global
window.generateResumePDF = async function() {
    // Verifica se está em um dispositivo móvel
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Mostrar mensagem de processamento
    if (!document.getElementById('pdf-processing-message')) {
        const messageDiv = document.createElement('p');
        messageDiv.id = 'pdf-processing-message';
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translateX(-50%)';
        messageDiv.style.backgroundColor = '#2563eb';
        messageDiv.style.color = '#FFF';
        messageDiv.style.padding = '10px 20px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        messageDiv.textContent = 'Processando o PDF, aguarde...';
        document.body.appendChild(messageDiv);
    }
    
    // Adicionar estado de carregamento aos botões
    const buttons = document.querySelectorAll('#generatePdfButton');
    buttons.forEach(button => {
        button.classList.add('loading-button');
        button.disabled = true;
    });

    try {
        // Carregar as bibliotecas necessárias
        await loadLibraries();
        
        // Carregar os dados do currículo
        const response = await fetch('/data.json');
        const data = await response.json();
        
        console.log('Carregando e convertendo SVGs...');
        // Pré-carregar ícones de tecnologias, incluindo conversão de SVG
        const techIconsCache = await preloadTechIcons(data);
        
        // Carregar as imagens de ícones para a linha do tempo
        let expIcon, eduIcon, prjIcon;
        try {
            expIcon = await loadImage('/assets/curriculum/images/pdf/EXP.png');
            console.log('Ícone EXP carregado com sucesso');
            
            eduIcon = await loadImage('/assets/curriculum/images/pdf/EDU.png');
            console.log('Ícone EDU carregado com sucesso');
            
            prjIcon = await loadImage('/assets/curriculum/images/pdf/PRJ.png');
            console.log('Ícone PRJ carregado com sucesso');
        } catch (e) {
            console.warn('Não foi possível carregar os ícones PNG, criando substitutos:', e);
            expIcon = await createIconImage('EXP', '#2563eb');
            eduIcon = await createIconImage('EDU', '#2563eb');
            prjIcon = await createIconImage('PRJ', '#2563eb');
        }

        // Carregar a imagem de perfil
        let profileImage;
        try {
            profileImage = await loadImage(data.profileImage.replace("images", "images-crop"));
            console.log('Imagem de perfil carregada com sucesso:', data.profileImage.replace("images", "images-crop"));
        } catch (e) {
            console.warn('Não foi possível carregar a imagem de perfil:', e);
            try {
                // Tentar carregar a imagem original se a versão crop não existir
                profileImage = await loadImage(data.profileImage);
                console.log('Imagem de perfil original carregada com sucesso');
            } catch (e2) {
                console.warn('Não foi possível carregar nenhuma versão da imagem de perfil:', e2);
            }
        }
        
        // Inicializar o PDF - A4 no modo retrato
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true,
            compress: true // Comprimir o PDF para reduzir o tamanho
        });
        
        // Definir cores do tema escuro
        const colors = {
            background: '#0f0f0f',
            text: '#ffffff',
            primary: '#2563eb',
            secondary: '#272727',
            tertiary: '#1b1b1b'
        };
        
        // Configurar fonte
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(colors.text);
        
        // Adicionar fundo escuro à primeira página
        addBackgroundToCurrentPage(pdf, colors.background);
        
        // Adicionar cabeçalho com dados pessoais
        addHeader(pdf, data, colors, profileImage);
        
        // Posição vertical atual
        let yPos = 60;
        
        // Adicionar linha do tempo (experiências, educação, projetos)
        yPos = addTimeline(pdf, data, yPos, colors, expIcon, eduIcon, prjIcon, techIconsCache);
        
        // Adicionar habilidades técnicas
        yPos = addTechnicalSkills(pdf, data, yPos, colors);
        
        // Adicionar habilidades extras
        yPos = addExtraSkills(pdf, data, yPos, colors);
        
        // Adicionar hobbies/interesses
        addInterests(pdf, data, yPos, colors);
        
        // Salvar o PDF
        pdf.save('curriculo-' + data.name.replace(/\s+/g, '-').toLowerCase() + '.pdf');
        
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF: ' + error.message);
    } finally {
        // Remover estado de carregamento dos botões
        const buttons = document.querySelectorAll('#generatePdfButton');
        buttons.forEach(button => {
            button.classList.remove('loading-button');
            button.disabled = false;
        });
        
        // Remover mensagem de processamento
        const messageDiv = document.getElementById('pdf-processing-message');
        if (messageDiv) {
            messageDiv.remove();
        }
    }
};

// Criar uma imagem dinamicamente com texto (para fallback)
async function createIconImage(text, bgColor) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 30;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        
        // Desenhar círculo
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(15, 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Escrever texto
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 15, 15);
        
        // Converter para imagem
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = canvas.toDataURL('image/png');
    });
}

// Função para carregar bibliotecas
async function loadLibraries() {
    console.log('Carregando bibliotecas...');
    
    return new Promise((resolve, reject) => {
        // Verificar se as bibliotecas já estão carregadas
        if (window.jspdf && window.html2canvas) {
            console.log('Bibliotecas já estão carregadas');
            resolve();
            return;
        }
        
        // Carregar jsPDF
        const jsPDFScript = document.createElement('script');
        jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jsPDFScript.async = true;
        
        // Carregar html2canvas
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        html2canvasScript.async = true;
        
        let loadedCount = 0;
        const totalScripts = 2;
        
        const onLoad = () => {
            loadedCount++;
            console.log(`Biblioteca ${loadedCount}/${totalScripts} carregada`);
            if (loadedCount === totalScripts) {
                // Pequeno atraso para garantir que tudo foi inicializado corretamente
                setTimeout(() => {
                    console.log('Todas as bibliotecas carregadas!');
                    resolve();
                }, 100);
            }
        };
        
        jsPDFScript.onload = onLoad;
        html2canvasScript.onload = onLoad;
        
        jsPDFScript.onerror = (e) => {
            console.error('Erro ao carregar jsPDF:', e);
            reject(new Error('Falha ao carregar jsPDF'));
        };
        html2canvasScript.onerror = (e) => {
            console.error('Erro ao carregar html2canvas:', e);
            reject(new Error('Falha ao carregar html2canvas'));
        };
        
        document.head.appendChild(jsPDFScript);
        document.head.appendChild(html2canvasScript);
    });
}

// Função para carregar imagens
async function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => {
            console.error(`Erro ao carregar imagem ${url}:`, e);
            reject(new Error(`Falha ao carregar imagem ${url}`));
        };
        img.src = url;
    });
}

// Função para adicionar fundo escuro à página atual
function addBackgroundToCurrentPage(pdf, backgroundColor) {
    pdf.setFillColor(backgroundColor);
    pdf.rect(0, 0, 210, 297, 'F');
}

function addHeader(pdf, data, colors, profileImage) {
    // Adicionar background do cabeçalho
    pdf.setFillColor(colors.tertiary);
    pdf.rect(0, 0, 210, 50, 'F');
    
    // Adicionar linha de destaque
    pdf.setFillColor(colors.primary);
    pdf.rect(0, 50, 210, 2, 'F');
    
    // Adicionar nome
    pdf.setFontSize(24);
    pdf.setTextColor(colors.primary);
    pdf.text(data.name, 15, 20);
    
    // Adicionar dados pessoais
    pdf.setFontSize(10);
    pdf.setTextColor(colors.text);
    
    let contactY = 30;
    data.personal_data.forEach(item => {
        if (item.key !== "Nome completo") {
            pdf.text(`${item.key}: ${item.value}`, 15, contactY);
            contactY += 6;
        }
    });
    
    // Adicionar links de github e linkedin
    pdf.setTextColor(colors.primary);
    pdf.text("Github: " + data.github, 80, 36);
    pdf.text("LinkedIn: " + data.linkedin, 80, 42);
    pdf.setTextColor(colors.text);
    
    // Adicionar imagem de perfil
    if (profileImage) {
        try {
            // Calcular as dimensões para a imagem (usando proporção correta)
            const imgWidth = 35;
            const imgHeight = 35;
            const imgX = 165;  // Posição X no canto direito
            const imgY = 10;   // Posição Y no topo
            
            // Adicionar uma borda circular para a foto
            pdf.addImage(
                profileImage, 
                'PNG', 
                imgX, 
                imgY, 
                imgWidth, 
                imgHeight
            );
            
            console.log('Imagem de perfil adicionada ao PDF');
        } catch (error) {
            console.error('Erro ao adicionar a imagem de perfil ao PDF:', error);
        }
    }
}

function addTimeline(pdf, data, startY, colors, expIcon, eduIcon, prjIcon, techIconsCache) {
    let yPos = startY + 10;
    
    // Título da seção
    pdf.setFontSize(16);
    pdf.setTextColor(colors.primary);
    pdf.text("Linha do Tempo Profissional", 15, yPos);
    yPos += 5;
    
    // Combinar experiências, educação e projetos em uma única linha do tempo
    const timeline = [
        ...data.experience.map(item => ({
            ...item,
            type: 'experience',
            startDate: parseDate(item.start),
            endDate: item.end === 'Hoje' ? new Date() : parseDate(item.end)
        })),
        ...data.education.map(item => ({
            ...item,
            type: 'education',
            title: item.degree,
            company: item.institution,
            startDate: parseDate(item.start),
            endDate: item.end === 'Hoje' ? new Date() : parseDate(item.end)
        })),
        ...data.projects.map(item => ({
            ...item,
            type: 'project',
            title: item.name,
            company: '',
            start: '',
            end: '',
            startDate: new Date(2020, 0, 1), // Simplificação já que projetos não têm data explícita
            endDate: new Date(2020, 0, 1)
        }))
    ];
    
    // Ordenar por data (mais recente primeiro)
    timeline.sort((a, b) => b.startDate - a.startDate);
    
    // Desenhar a linha temporal
    pdf.setDrawColor(colors.primary);
    pdf.setLineWidth(0.5);
    
    // Adicionar cada item à linha do tempo
    timeline.forEach((item, index) => {
        // Verificar se precisamos de uma nova página
        if (yPos > 270) {
            pdf.addPage();
            // Adicionar fundo escuro à nova página
            addBackgroundToCurrentPage(pdf, colors.background);
            
            // Resetar posição Y 
            yPos = 20;
        }
        
        // Desenhar marcador na linha temporal
        pdf.setFillColor(colors.primary);
        pdf.circle(25, yPos + 5, 2, 'F');

        // Redesenhar a linha temporal para a próxima seção
        pdf.setDrawColor(colors.primary);
        if(index > 0) pdf.line(25, yPos - 36, 25, yPos + 4);
        
        // Configurar título do item
        pdf.setFontSize(12);
        pdf.setTextColor(colors.primary);
        const title = item.title+ (item.company ? ` - ${item.company}` : '');
        pdf.text(title, 35, yPos + 5);
        
        // Configurar período
        pdf.setFontSize(9);
        pdf.setTextColor(colors.text);
        const period = item.start && item.end ? `${item.start} - ${item.end}` : '';
        if (period) {
            pdf.text(period, 170, yPos + 5);
        }
        
        // Descrição
        pdf.setFontSize(9);
        const description = item.description;
        const wrappedText = pdf.splitTextToSize(description, 150);
        pdf.text(wrappedText, 35, yPos + 12);
        
        // Palavras-chave e ícones
        if (item.keywords && item.keywords.length > 0) {
            const baseY = yPos + 12 + wrappedText.length * 4;
            
            // Texto das palavras-chave
            pdf.setFontSize(8);
            pdf.setTextColor('#aaaaaa');
            const keywords = item.keywords.join(', ');
            const wrappedKeywords = pdf.splitTextToSize(`Tecnologias: ${keywords}`, 150);
            pdf.text(wrappedKeywords, 35, baseY);
            
            // Adicionar ícones das tecnologias
            if (item.icons && item.icons.length > 0 && techIconsCache) {
                const iconsPerRow = 20;
                const iconSize = 5;
                const iconSpacing = 2;
                const startX = 35;
                const startY = baseY + wrappedKeywords.length * 4;
                
                // Limitar o número de ícones para evitar sobreposição
                const maxIcons = 16;
                
                // Adicionar ícones em linhas
                for (let i = 0; i < Math.min(item.icons.length, maxIcons); i++) {
                    try {
                        const iconPath = item.icons[i];
                        const row = Math.floor(i / iconsPerRow);
                        const col = i % iconsPerRow;
                        const iconX = startX + col * (iconSize + iconSpacing);
                        const iconY = startY + row * (iconSize + iconSpacing);
                        
                        // Verificar se o ícone foi pré-carregado e está no cache
                        if (techIconsCache[iconPath]) {
                            pdf.addImage(
                                techIconsCache[iconPath], 
                                'PNG', 
                                iconX, 
                                iconY, 
                                iconSize, 
                                iconSize
                            );
                            console.log(`Ícone adicionado ao PDF: ${iconPath}`);
                        } else {
                            console.warn(`Ícone não encontrado no cache: ${iconPath}`);
                        }
                    } catch (error) {
                        console.warn(`Erro ao adicionar ícone de tecnologia: ${item.icons[i]}`, error);
                    }
                }
            }
        }
        
        // Adicionar ícone de tipo
        try {
            switch (item.type) {
                case 'experience':
                    if (expIcon) {
                        pdf.addImage(expIcon, 'PNG', 10, yPos, 7, 7);
                    } else {
                        pdf.setTextColor(colors.primary);
                        pdf.setFontSize(8);
                        pdf.text('EXP', 10, yPos + 5);
                    }
                    break;
                case 'education':
                    if (eduIcon) {
                        pdf.addImage(eduIcon, 'PNG', 10, yPos, 7, 7);
                    } else {
                        pdf.setTextColor(colors.primary);
                        pdf.setFontSize(8);
                        pdf.text('EDU', 10, yPos + 5);
                    }
                    break;
                case 'project':
                    if (prjIcon) {
                        pdf.addImage(prjIcon, 'PNG', 10, yPos, 7, 7);
                    } else {
                        pdf.setTextColor(colors.primary);
                        pdf.setFontSize(8);
                        pdf.text('PRJ', 10, yPos + 5);
                    }
                    break;
            }
        } catch (e) {
            console.warn('Erro ao adicionar ícone:', e);
            // Fallback para texto em caso de erro
            pdf.setTextColor(colors.primary);
            pdf.setFontSize(8);
            pdf.text(item.type.substring(0, 3).toUpperCase(), 10, yPos + 5);
        }
        
        // Adicionar espaço entre itens
        yPos += 36;
    });
    
    return yPos + 10;
}

function addTechnicalSkills(pdf, data, startY, colors) {
    // Verificar se precisamos de uma nova página
    if (startY > 240) {
        pdf.addPage();
        // Adicionar fundo escuro à nova página
        addBackgroundToCurrentPage(pdf, colors.background);
        startY = 20;
    }
    
    let yPos = startY;
    
    // Título da seção
    pdf.setFontSize(16);
    pdf.setTextColor(colors.primary);
    pdf.text("Habilidades Técnicas", 15, yPos);
    yPos += 5;
    
    // Fundo da seção
    pdf.setFillColor(colors.secondary);
    pdf.roundedRect(15, yPos, 180, 50, 3, 3, 'F');
    
    // Organizar habilidades em colunas
    const skillsPerColumn = 5;
    const numColumns = 3;
    const columnWidth = 180 / numColumns;
    
    data.techinical_skills.sort((a, b) => b.level - a.level);
    
    for (let i = 0; i < data.techinical_skills.length; i++) {
        const skill = data.techinical_skills[i];
        const column = Math.floor(i / skillsPerColumn);
        const row = i % skillsPerColumn;
        
        if (column < numColumns) {
            const x = 20 + column * columnWidth;
            const y = yPos + 10 + row * 8;
            
            // Nome da habilidade
            pdf.setFontSize(9);
            pdf.setTextColor(colors.text);
            pdf.text(skill.name, x, y);
            
            // Nível de habilidade (pontos)
            for (let j = 0; j < 5; j++) {
                if (j < skill.level) {
                    pdf.setFillColor(colors.primary);
                } else {
                    pdf.setFillColor('#444444');
                }
                pdf.circle(x + 25 + j * 5, y - 1, 1.5, 'F');
            }
        }
    }
    
    return yPos + 60;
}

function addExtraSkills(pdf, data, startY, colors) {
    // Verificar se precisamos de uma nova página
    if (startY > 240) {
        pdf.addPage();
        // Adicionar fundo escuro à nova página
        addBackgroundToCurrentPage(pdf, colors.background);
        startY = 20;
    }
    
    let yPos = startY;
    
    // Título da seção
    pdf.setFontSize(16);
    pdf.setTextColor(colors.primary);
    pdf.text("Habilidades Extras", 15, yPos);
    yPos += 5;
    
    // Fundo da seção
    pdf.setFillColor(colors.secondary);
    pdf.roundedRect(15, yPos, 180, 75, 3, 3, 'F');
    
    // Organizar habilidades em colunas
    const skillsPerColumn = 4;
    const numColumns = 2;
    const columnWidth = 180 / numColumns;
    
    for (let i = 0; i < data.extra_skills.length; i++) {
        const skill = data.extra_skills[i];
        const column = Math.floor(i / skillsPerColumn);
        const row = i % skillsPerColumn;
        
        if (column < numColumns) {
            const x = 20 + column * columnWidth;
            const y = yPos + 10 + row * 18;
            
            // Nome da habilidade
            pdf.setFontSize(10);
            pdf.setTextColor(colors.primary);
            pdf.text(skill.name, x, y);
            
            // Descrição da habilidade
            pdf.setFontSize(8);
            pdf.setTextColor(colors.text);
            const description = skill.description.replace(/<br>/g, ', ');
            const wrappedDesc = pdf.splitTextToSize(description, columnWidth - 10);
            pdf.text(wrappedDesc, x, y + 4);
        }
    }
    
    return yPos + 85;
}

function addInterests(pdf, data, startY, colors) {
    // Verificar se precisamos de uma nova página
    if (startY > 260) {
        pdf.addPage();
        // Adicionar fundo escuro à nova página
        addBackgroundToCurrentPage(pdf, colors.background);
        startY = 20;
    }
    
    let yPos = startY;
    
    // Título da seção
    pdf.setFontSize(16);
    pdf.setTextColor(colors.primary);
    pdf.text("Interesses", 15, yPos);
    yPos += 5;
    
    // Fundo da seção
    pdf.setFillColor(colors.secondary);
    pdf.roundedRect(15, yPos, 180, 20, 3, 3, 'F');
    
    // Formatar interesses
    pdf.setFontSize(9);
    pdf.setTextColor(colors.text);
    const interests = data.interests.join(' • ');
    const wrappedInterests = pdf.splitTextToSize(interests, 170);
    pdf.text(wrappedInterests, 20, yPos + 10);
    
    // Rodapé
    yPos = 285;
    pdf.setFontSize(8);
    pdf.setTextColor('#888888');
    pdf.text('Currículo gerado em ' + new Date().toLocaleDateString(), 15, yPos);
    pdf.text('ruanps.com.br', 170, yPos);
}

function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    
    const [month, year] = dateStr.split('/');
    if (month && year) {
        return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    return new Date(0);
}

// Este console.log será executado quando o arquivo for carregado
console.log('PDF Generator script inicializado!');