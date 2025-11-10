// Variable global para el estado de calibración
let isCalibrated = false; 

// Constante del producto iónico del agua a 25°C
const Kw = 1.0e-14;

// DATOS DE CONCENTRACIÓN Y CONSTANTES DE EQUILIBRIO
const solutionsData = {
    // --- Neutrales y Tampones ---
    "H2O": { type: 'Neutral', Molarity: 1.0e-7, Ka: Kw, Kb: Kw, pH: 7.0, color: "#ADD8E6" },        
    "buffer4": { type: 'WeakAcid', Molarity: 0.1, Ka: 1.0e-4, Kb: null, pH: 4.0, color: "#FF6347" },       
    "buffer7": { type: 'Neutral', Molarity: 0.1, Ka: Kw, Kb: Kw, pH: 7.0, color: "#00BFFF" },     
    "buffer10": { type: 'WeakBase', Molarity: 0.1, Ka: null, Kb: 1.0e-4, pH: 10.0, color: "#DA70D6" },     
    
    // --- Ácidos Fuertes (Ka muy grande) ---
    "StomachAcid": { type: 'StrongAcid', Molarity: 0.0316, Ka: 1.0e+6, Kb: null, pH: 1.5, color: "#B22222" }, 

    // --- Ácidos Débiles (Requieren Ka) ---
    "LemonJuice": { type: 'WeakAcid', Molarity: 0.1, Ka: 7.4e-4, Kb: null, pH: 2.13, color: "#FFA07A" },     
    "Vinegar": { type: 'WeakAcid', Molarity: 0.83, Ka: 1.8e-5, Kb: null, pH: 2.37, color: "#FFD700" },      
    "Coffee": { type: 'WeakAcid', Molarity: 0.0001, Ka: 1.0e-5, Kb: null, pH: 4.0, color: "#A0522D" },     

    // --- Bases Fuertes (Kb muy grande) ---
    "DrainCleaner": { type: 'StrongBase', Molarity: 0.316, Ka: null, Kb: 1.0e+6, pH: 13.5, color: "#FFA07A" }, 
    
    // --- Bases Débiles (Requieren Kb) ---
    "BakingSoda": { type: 'WeakBase', Molarity: 0.1, Ka: null, Kb: 2.3e-8, pH: 8.33, color: "#90EE90" },   
    "Ammonia": { type: 'WeakBase', Molarity: 0.1, Ka: null, Kb: 1.8e-5, pH: 11.13, color: "#9370DB" },    
    "Bleach": { type: 'WeakBase', Molarity: 0.01, Ka: null, Kb: 3.5e-7, pH: 10.53, color: "#FFFFE0" },     
};


// =========================================================================
// FUNCIONES AUXILIARES DE TRADUCCIÓN Y FORMATO
// =========================================================================

function translateType(type) {
    switch (type) {
        case 'StrongAcid': return 'Ácido Fuerte';
        case 'WeakAcid': return 'Ácido Débil';
        case 'StrongBase': return 'Base Fuerte';
        case 'WeakBase': return 'Base Débil';
        case 'Neutral': return 'Neutro';
        default: return type;
    }
}

function translateSubstanceName(key) {
    switch (key) {
        case 'StomachAcid': return 'Ácido Gástrico';
        case 'LemonJuice': return 'Jugo de Limón';
        case 'Vinegar': return 'Vinagre';
        case 'Coffee': return 'Café';
        case 'DrainCleaner': return 'Limpiador de Desagües';
        case 'BakingSoda': return 'Bicarbonato de Sodio';
        case 'Ammonia': return 'Amoníaco';
        case 'Bleach': return 'Cloro/Lejía';
        default: return key.replace(/([A-Z])/g, ' $1').trim();
    }
}

/**
 * Convierte un número en notación científica (ej. 3.16e-2) a formato "x 10⁻ⁿ".
 */
function formatScientific(num) {
    if (num === null) return 'N/A';
    if (num >= 1 || num === 0) return num.toFixed(2);
    
    const expStr = num.toExponential(2); 
    const parts = expStr.split('e');
    const mantissa = parseFloat(parts[0]).toFixed(2);
    const exponent = parseInt(parts[1], 10);
    
    if (exponent === 0) return mantissa; 
    
    return `${mantissa} x 10${exponent.toString().replace(/-/g, '⁻')}`;
}


// =========================================================================
// FUNCIÓN DE CALIBRACIÓN
// =========================================================================

function calibrate() {
    const bufferSelect = document.getElementById('buffer-select');
    const selectedBuffer = bufferSelect.value;
    const phDisplay = document.getElementById('ph-display');
    const liquid = document.getElementById('solution-liquid');
    const statusText = document.getElementById('calibration-status');
    const mixingArea = document.getElementById('mixing-area');
    const mixButton = document.getElementById('mix-button');
    const phClassification = document.getElementById('ph-classification');

    if (selectedBuffer === "") {
        return;
    }

    const targetPh = solutionsData[selectedBuffer].pH.toFixed(2);
    const targetColor = solutionsData[selectedBuffer].color;

    phDisplay.textContent = targetPh;
    phClassification.textContent = 'Clasificación: --'; 
    phClassification.style.color = '#333';
    liquid.style.backgroundColor = targetColor;
    liquid.classList.add('stirred-liquid'); 

    setTimeout(() => {
        isCalibrated = true;
        statusText.textContent = 'Estado del Electrodo: Calibrado (2 puntos: 4 y 7)';
        statusText.classList.remove('status-warning');
        statusText.classList.add('status-ok');
        
        mixingArea.classList.remove('disabled-area');
        mixButton.disabled = false;
        
        phDisplay.textContent = '7.00'; 
        phClassification.textContent = 'Clasificación: NEUTRO';
        phClassification.style.color = 'green';
        liquid.style.backgroundColor = '#ccc';
        liquid.classList.remove('stirred-liquid');
        
        alert(`¡Calibración exitosa! El medidor se ha ajustado a pH ${targetPh}.`);
        
    }, 1500);
}


// =========================================================================
// LÓGICA DE CÁLCULO QUÍMICO
// =========================================================================

/**
 * Calcula las moles de H+ o OH- en el volumen dado después de la dilución, considerando equilibrio.
 */
function calculatePh(solutionName, volume_mL, totalVolume_L) {
    const data = solutionsData[solutionName];
    const initialMolarity = data.Molarity;
    
    const dilutedMolarity = initialMolarity * (volume_mL / 1000) / totalVolume_L;
    
    let H_moles = 0;
    let OH_moles = 0;
    
    if (data.type.includes('Strong')) {
        if (data.type === 'StrongAcid') {
            H_moles = dilutedMolarity * totalVolume_L;
        } else { // StrongBase
            OH_moles = dilutedMolarity * totalVolume_L;
        }
    } 
    else if (data.type.includes('Weak')) {
        if (data.type === 'WeakAcid') {
            const Ka = data.Ka;
            const H_Molarity = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * dilutedMolarity)) / 2;
            H_moles = H_Molarity * totalVolume_L;
        } else { // WeakBase
            const Kb = data.Kb || (Kw / data.Ka);
            const OH_Molarity = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * dilutedMolarity)) / 2;
            OH_moles = OH_Molarity * totalVolume_L;
        }
    }
    else { // Neutral
        H_moles = 1.0e-7 * totalVolume_L;
        OH_moles = 1.0e-7 * totalVolume_L;
    }

    return { H_moles: H_moles, OH_moles: OH_moles };
}

/**
 * Función principal para mezclar soluciones.
 */
function mixSolutions() {
    if (!isCalibrated) {
        alert("¡Error de Medición! El pH Metro no ha sido calibrado. Utilice un tampón (buffer) primero.");
        return; 
    }
    
    const stirBar = document.getElementById('stir-bar');
    const liquid = document.getElementById('solution-liquid');
    const phDisplay = document.getElementById('ph-display');
    const phClassification = document.getElementById('ph-classification');

    stirBar.classList.add('stirring');
    liquid.classList.add('stirred-liquid');
    
    const sol1Name = document.getElementById('solution1-select').value;
    const vol1_mL = parseFloat(document.getElementById('volume1').value);
    const sol2Name = document.getElementById('solution2-select').value;
    const vol2_mL = parseFloat(document.getElementById('volume2').value);


    if (!sol1Name || !sol2Name || isNaN(vol1_mL) || isNaN(vol2_mL) || vol1_mL <= 0 || vol2_mL <= 0) {
        phDisplay.textContent = 'ERROR';
        liquid.style.backgroundColor = '#ccc';
        return;
    }

    const totalVolume_L = (vol1_mL + vol2_mL) / 1000;

    const moles1 = calculatePh(sol1Name, vol1_mL, totalVolume_L);
    const moles2 = calculatePh(sol2Name, vol2_mL, totalVolume_L);
    
    const totalH_moles = moles1.H_moles + moles2.H_moles;
    const totalOH_moles = moles1.OH_moles + moles2.OH_moles;
    
    let newPh;

    if (totalH_moles > totalOH_moles) {
        const netH_moles = totalH_moles - totalOH_moles;
        const newH_Molarity = netH_moles / totalVolume_L;
        newPh = -Math.log10(newH_Molarity);
    } else if (totalOH_moles > totalH_moles) {
        const netOH_moles = totalOH_moles - totalH_moles;
        const newOH_Molarity = netOH_moles / totalVolume_L;
        const pOH = -Math.log10(newOH_Molarity);
        newPh = 14 - pOH;
    } else {
        newPh = 7.0;
    }

    newPh = Math.max(0, Math.min(14, newPh));

    // Mostrar el resultado y la clasificación
    phDisplay.textContent = newPh.toFixed(2);
    
    // Lógica de Clasificación
    let classificationText = '';
    if (newPh > 7.0001) {
        classificationText = 'Clasificación: BÁSICO';
        phClassification.style.color = 'purple';
    } else if (newPh < 6.9999) {
        classificationText = 'Clasificación: ÁCIDO';
        phClassification.style.color = 'red';
    } else {
        classificationText = 'Clasificación: NEUTRO';
        phClassification.style.color = 'green';
    }
    phClassification.textContent = classificationText;
    
    // Simulación de color
    const normalizedPh = newPh / 14; 
    const r = Math.round(255 * (1 - normalizedPh));
    const b = Math.round(255 * normalizedPh);
    liquid.style.backgroundColor = `rgb(${r}, 100, ${b})`;
    
    setTimeout(() => {
        stirBar.classList.remove('stirring');
        liquid.classList.remove('stirred-liquid');
    }, 1500);
}


// =========================================================================
// FUNCIÓN PARA AGREGAR SUSTANCIAS PERSONALIZADAS
// =========================================================================

function addCustomSolution() {
    let name = document.getElementById('new-name').value.trim();
    const phInput = parseFloat(document.getElementById('new-ph').value);
    const molarityInput = parseFloat(document.getElementById('new-molarity').value);
    const type = document.getElementById('new-type').value;

    if (!name || (isNaN(phInput) && isNaN(molarityInput))) {
        alert("Por favor, introduce un Nombre y al menos un valor de pH o Molaridad.");
        return;
    }
    
    const key = name.replace(/\s+/g, ''); 
    let finalPh = phInput;
    let finalMolarity = molarityInput;
    let finalKa = null;
    let finalKb = null;

    if (!isNaN(phInput) && isNaN(molarityInput)) {
        if (type.includes('Strong')) {
            finalMolarity = type.includes('Acid') ? Math.pow(10, -finalPh) : Math.pow(10, -(14-finalPh));
            finalKa = finalKb = 1.0e+6; 
        } else if (type.includes('Weak')) {
            finalMolarity = 0.1;
            if (type.includes('Acid')) {
                finalKa = Math.pow(10, -finalPh) * Math.pow(10, -finalPh) / (finalMolarity - Math.pow(10, -finalPh));
            } else { // WeakBase
                const pOH = 14 - finalPh;
                finalKb = Math.pow(10, -pOH) * Math.pow(10, -pOH) / (finalMolarity - Math.pow(10, -pOH));
            }
        }
    } else if (!isNaN(molarityInput)) {
        finalMolarity = molarityInput;
        if (type.includes('Strong')) {
            finalKa = finalKb = 1.0e+6;
            finalPh = type.includes('Acid') ? -Math.log10(finalMolarity) : 14 + Math.log10(finalMolarity);
        } else if (type.includes('Weak')) {
            if (type.includes('Acid')) {
                finalKa = 1.8e-5; 
                const H_Molarity = (-finalKa + Math.sqrt(finalKa * finalKa + 4 * finalKa * finalMolarity)) / 2;
                finalPh = -Math.log10(H_Molarity);
            } else { // WeakBase
                finalKb = 1.8e-5; 
                const OH_Molarity = (-finalKb + Math.sqrt(finalKb * finalKb + 4 * finalKb * finalMolarity)) / 2;
                finalPh = 14 + Math.log10(OH_Molarity);
            }
        }
    } else {
        alert("Faltan datos para el cálculo.");
        return;
    }

    solutionsData[key] = {
        pH: finalPh,
        Molarity: finalMolarity,
        type: type,
        Ka: finalKa,
        Kb: finalKb,
        color: type.includes('Acid') ? '#F08080' : (type.includes('Base') ? '#6A5ACD' : '#87CEFA'), 
    };

    updateSelectOptions(key, name, finalPh);
    loadReferenceTable();

    alert(`¡Sustancia "${name}" (pH ${finalPh.toFixed(2)}) agregada exitosamente!`);
    
    document.getElementById('new-name').value = '';
    document.getElementById('new-ph').value = '';
    document.getElementById('new-molarity').value = '';
}

function updateSelectOptions(key, name, ph) {
    const select1 = document.getElementById('solution1-select');
    const select2 = document.getElementById('solution2-select');
    
    const displayType = translateType(solutionsData[key].type); 

    const newOption = new Option(`${name} (${displayType})`, key);
    const newOption2 = new Option(`${name} (${displayType})`, key); 
    
    select1.appendChild(newOption);
    select2.appendChild(newOption2);
}

// =========================================================================
// FUNCIÓN PARA LLENAR LA TABLA DE REFERENCIA
// =========================================================================

function loadReferenceTable() {
    const tableBody = document.querySelector('#solution-data-table tbody');
    tableBody.innerHTML = ''; 
    
    const substances = Object.keys(solutionsData).filter(key => 
        !key.startsWith('buffer') && key !== 'H2O'
    );

    substances.forEach(key => {
        const data = solutionsData[key];
        
        const molarityDisplay = formatScientific(data.Molarity); 
        const row = tableBody.insertRow();
        
        // 1. Sustancia (Traducida)
        row.insertCell().textContent = translateSubstanceName(key);
        
        // 2. pH Inicial
        row.insertCell().textContent = data.pH.toFixed(2);
        
        // 3. Molaridad Inicial con formato 'x 10⁻ⁿ'
        row.insertCell().textContent = molarityDisplay;
        
        // 4. Tipo (Traducido)
        row.insertCell().textContent = translateType(data.type);
        
        // 5. Ka / Kb con formato 'x 10⁻ⁿ'
        let kaKbValue = '';
        if (data.Ka && data.Ka > Kw && data.type.includes('Acid')) {
            kaKbValue = formatScientific(data.Ka);
        } else if (data.Kb && data.Kb > Kw && data.type.includes('Base')) {
            kaKbValue = formatScientific(data.Kb);
        } else if (data.type.includes('Strong')) {
            kaKbValue = 'Muy Grande';
        } else {
            kaKbValue = 'N/A';
        }
        row.insertCell().textContent = kaKbValue;
    });
}


// =========================================================================
// FUNCIÓN DE RESETEO (LIMPIEZA)
// =========================================================================

function resetSimulation() {
    isCalibrated = false;

    const phDisplay = document.getElementById('ph-display');
    const liquid = document.getElementById('solution-liquid');
    const statusText = document.getElementById('calibration-status');
    const mixingArea = document.getElementById('mixing-area');
    const mixButton = document.getElementById('mix-button');
    const stirBar = document.getElementById('stir-bar');
    const phClassification = document.getElementById('ph-classification');
    
    phDisplay.textContent = '--';
    phClassification.textContent = 'Clasificación: --'; 
    phClassification.style.color = '#333';
    statusText.textContent = 'Estado del Electrodo: No Calibrado';
    statusText.classList.remove('status-ok');
    statusText.classList.add('status-warning');

    liquid.style.backgroundColor = '#ccc';
    liquid.classList.remove('stirred-liquid');
    stirBar.classList.remove('stirring');

    mixingArea.classList.add('disabled-area');
    mixButton.disabled = true;

    document.getElementById('volume1').value = 100;
    document.getElementById('volume2').value = 100;
    document.getElementById('solution1-select').selectedIndex = 0; 
    document.getElementById('solution2-select').selectedIndex = 0;

    alert("Simulador Reseteado. Por favor, calibre el pH Metro de nuevo antes de realizar mediciones.");
}


// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadReferenceTable(); 
    
    document.getElementById('ph-display').textContent = '--';
    document.getElementById('mixing-area').classList.add('disabled-area');
    document.getElementById('mix-button').disabled = true;
});