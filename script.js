/* ============================================= */
/* LÓGICA DE NAVEGAÇÃO DAS ABAS          */
/* ============================================= */

let myChart = null;

// Controle de Lead (ATUALIZADO COM LOCALSTORAGE)
// O sistema verifica se já existe o registro 'izi_lead_ok' no navegador do usuário.
// Se existir, ele já começa como TRUE (liberado). Se não, começa FALSE (bloqueado).
let leadCapturado = localStorage.getItem('izi_lead_ok') === 'true';

let ultimaTentativaSubmit = null; 

document.addEventListener('DOMContentLoaded', function() {
    
    // Se o lead já foi capturado anteriormente, podemos (opcionalmente) avisar no console
    if (leadCapturado) {
        console.log("Bem-vindo de volta! Acesso liberado via LocalStorage.");
    }

    const tabsNav = document.getElementById('tabs-nav');
    const tabsContent = document.querySelectorAll('.tab-content');
    const tabLinks = document.querySelectorAll('.tab-link');
    const resultadoContainer = document.getElementById('resultado-container');

    tabsNav.addEventListener('click', (event) => {
        if (!event.target.classList.contains('tab-link')) return;

        resultadoContainer.innerHTML = '';
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }

        tabLinks.forEach(link => link.classList.remove('active-tab'));
        tabsContent.forEach(content => content.classList.remove('active-content'));

        event.target.classList.add('active-tab');
        const tabId = event.target.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active-content');
    });

    configurarModalLead();
});

/* ============================================= */
/* LÓGICA DO MODAL DE LEAD & INTEGRAÇÕES        */
/* ============================================= */

function configurarModalLead() {
    const modal = document.getElementById('modal-lead');
    const spanClose = document.querySelector('.close-modal');
    const formLead = document.getElementById('form-lead');
    const inputTelefone = document.getElementById('lead-telefone');
    const btnSubmit = formLead.querySelector('button[type="submit"]');

    spanClose.onclick = () => modal.classList.remove('mostrar-modal');
    window.onclick = (event) => {
        if (event.target == modal) modal.classList.remove('mostrar-modal');
    };

    inputTelefone.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    formLead.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const textoOriginal = btnSubmit.innerText;
        btnSubmit.innerText = "Enviando... 🚀";
        btnSubmit.disabled = true;

        const nome = document.getElementById('lead-nome').value;
        const email = document.getElementById('lead-email').value;
        const telefone = document.getElementById('lead-telefone').value;

        const dadosParaPlanilha = {
            'Nome': nome,
            'Email': email,
            'Telefone': telefone,
            'Data': new Date().toLocaleString('pt-BR')
        };

        const urlSheetMonkey = "https://api.sheetmonkey.io/form/eMvHQotQoBvTkRNScSMEyw"; 

        try {
            await fetch(urlSheetMonkey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosParaPlanilha),
            });
            console.log("Lead salvo na planilha com sucesso!");
        } catch (erro) {
            console.error("Erro ao salvar na planilha:", erro);
        }

        const telefoneLimpo = telefone.replace(/\D/g, ''); 
        const numeroCorretor = "5511953424035"; 

        const mensagemZap = `Olá! Meu nome é ${nome}. Acabei de fazer uma simulação na Calculadora IZI.
Meu telefone é: ${telefone}
Email: ${email}
Gostaria de ver detalhes sobre esse financiamento.`;

        const linkZap = `https://wa.me/${numeroCorretor}?text=${encodeURIComponent(mensagemZap)}`;
        
        window.open(linkZap, '_blank');

        // --- ATUALIZAÇÃO IMPORTANTE ---
        // 1. Marca na memória RAM (variável)
        leadCapturado = true;
        // 2. Marca na memória do NAVEGADOR (LocalStorage) para o futuro
        localStorage.setItem('izi_lead_ok', 'true');

        modal.classList.remove('mostrar-modal');
        
        btnSubmit.innerText = textoOriginal;
        btnSubmit.disabled = false;

        if (ultimaTentativaSubmit === 'imovel') {
            document.getElementById('calc-form').dispatchEvent(new Event('submit'));
        } else if (ultimaTentativaSubmit === 'renda') {
            document.getElementById('calc-form-renda').dispatchEvent(new Event('submit'));
        }
    });
}

function verificarLead(tipoFormulario) {
    if (leadCapturado) return true;
    ultimaTentativaSubmit = tipoFormulario;
    document.getElementById('modal-lead').classList.add('mostrar-modal');
    return false;
}


/* ============================================= */
/* FUNÇÕES GLOBAIS AUXILIARES           */
/* ============================================= */

function limparValorMoeda(valorFormatado) {
    if (!valorFormatado) return 0;
    let valorLimpo = valorFormatado.replace(/[^\d,]/g, ''); 
    valorLimpo = valorLimpo.replace(',', '.'); 
    return parseFloat(valorLimpo);
}

function formatarDinheiro(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function exibirErro(mensagem) {
    const container = document.getElementById('resultado-container');
    container.innerHTML = `<p class="erro">${mensagem}</p>`;
}


/* ============================================= */
/* ABA 1: CÁLCULO POR IMÓVEL (COM GATE)         */
/* ============================================= */

document.getElementById('calc-form').addEventListener('submit', function(event) {
    event.preventDefault();
    if (!verificarLead('imovel')) return;

    const resultadoContainer = document.getElementById('resultado-container');
    resultadoContainer.innerHTML = '';

    const valorImovel = limparValorMoeda(document.getElementById('valor-imovel').value);
    const valorEntrada = limparValorMoeda(document.getElementById('valor-entrada').value);
    const valorExtra = limparValorMoeda(document.getElementById('valor-extra').value);
    const taxaJurosAnual = parseFloat(document.getElementById('taxa-juros').value);
    const prazoAnos = parseFloat(document.getElementById('prazo-anos').value);
    const tipoAmortizacao = document.getElementById('tipo-amortizacao').value;

    if (isNaN(valorImovel) || isNaN(valorEntrada) || isNaN(taxaJurosAnual) || isNaN(prazoAnos)) {
        exibirErro("Por favor, preencha todos os campos com números válidos.");
        return; 
    }
    if (valorImovel <= 0 || taxaJurosAnual <= 0 || prazoAnos <= 0 || valorEntrada < 0) {
        exibirErro("Todos os valores (exceto entrada) devem ser positivos e maiores que zero.");
        return;
    }
    if (valorEntrada >= valorImovel) {
        exibirErro("O valor da entrada deve ser menor que o valor do imóvel.");
        return;
    }

    const valorFinanciado = valorImovel - valorEntrada;
    const prazoMeses = prazoAnos * 12;
    const taxaJurosMensal = (taxaJurosAnual / 100) / 12;

    let resultadoBase;
    if (tipoAmortizacao === 'price') {
        resultadoBase = calcularPriceLoop(valorFinanciado, taxaJurosMensal, prazoMeses, 0);
    } else {
        resultadoBase = calcularSACLoop(valorFinanciado, taxaJurosMensal, prazoMeses, 0);
    }

    let resultadoExtra = null;
    if (valorExtra > 0) {
        if (tipoAmortizacao === 'price') {
            resultadoExtra = calcularPriceLoop(valorFinanciado, taxaJurosMensal, prazoMeses, valorExtra);
        } else {
            resultadoExtra = calcularSACLoop(valorFinanciado, taxaJurosMensal, prazoMeses, valorExtra);
        }
    }

    exibirResultadoImovel(resultadoBase, resultadoExtra, tipoAmortizacao, valorEntrada, valorFinanciado);
});

function calcularPriceLoop(valorFinanciado, taxaJurosMensal, prazoOriginalMeses, valorExtra) {
    const pmt = valorFinanciado * (taxaJurosMensal * Math.pow(1 + taxaJurosMensal, prazoOriginalMeses)) / 
                (Math.pow(1 + taxaJurosMensal, prazoOriginalMeses) - 1);
    
    let saldoDevedor = valorFinanciado;
    let totalJuros = 0;
    let mesesDecorridos = 0;
    
    while (saldoDevedor > 0.01 && mesesDecorridos < prazoOriginalMeses * 2) { 
        mesesDecorridos++;
        let jurosDoMes = saldoDevedor * taxaJurosMensal;
        let amortizacaoNormal = pmt - jurosDoMes;
        
        let pagamentoMensal = pmt;
        if (saldoDevedor < amortizacaoNormal) {
            pagamentoMensal = saldoDevedor + jurosDoMes;
            amortizacaoNormal = saldoDevedor;
        }
        totalJuros += jurosDoMes;
        saldoDevedor -= amortizacaoNormal;
        
        if (valorExtra > 0 && saldoDevedor > 0) {
            let extraPossivel = (saldoDevedor < valorExtra) ? saldoDevedor : valorExtra;
            saldoDevedor -= extraPossivel;
        }
    }
    return {
        tipo: 'Price', primeiraParcela: pmt, totalJuros: totalJuros,
        totalPago: valorFinanciado + totalJuros, mesesTotais: mesesDecorridos
    };
}

function calcularSACLoop(valorFinanciado, taxaJurosMensal, prazoOriginalMeses, valorExtra) {
    const amortizacaoFixa = valorFinanciado / prazoOriginalMeses;
    let saldoDevedor = valorFinanciado;
    let totalJuros = 0;
    let mesesDecorridos = 0;
    let primeiraParcela = 0;
    let ultimaParcela = 0;

    while (saldoDevedor > 0.01) {
        mesesDecorridos++;
        let jurosDoMes = saldoDevedor * taxaJurosMensal;
        let parcelaAtual = amortizacaoFixa + jurosDoMes;
        let amortizacaoEfetiva = amortizacaoFixa;
        
        if (saldoDevedor < amortizacaoFixa) {
            amortizacaoEfetiva = saldoDevedor;
            parcelaAtual = amortizacaoEfetiva + jurosDoMes;
        }
        if (mesesDecorridos === 1) primeiraParcela = parcelaAtual;
        ultimaParcela = parcelaAtual;
        totalJuros += jurosDoMes;
        saldoDevedor -= amortizacaoEfetiva;

        if (valorExtra > 0 && saldoDevedor > 0) {
            let extraPossivel = (saldoDevedor < valorExtra) ? saldoDevedor : valorExtra;
            saldoDevedor -= extraPossivel;
        }
    }
    return {
        tipo: 'SAC', primeiraParcela: primeiraParcela, ultimaParcela: ultimaParcela,
        totalJuros: totalJuros, totalPago: valorFinanciado + totalJuros, mesesTotais: mesesDecorridos
    };
}

function exibirResultadoImovel(resultadoBase, resultadoExtra, tipo, valorEntrada, valorFinanciado) {
    const container = document.getElementById('resultado-container');
    if (myChart) myChart.destroy();

    const resultadoFinal = resultadoExtra ? resultadoExtra : resultadoBase;
    const custoTotal = resultadoFinal.totalPago + valorEntrada;
    let html = '';

    if (resultadoExtra) {
        const economiaJuros = resultadoBase.totalJuros - resultadoExtra.totalJuros;
        const mesesEconomizados = resultadoBase.mesesTotais - resultadoExtra.mesesTotais;
        const anosEconomizados = Math.floor(mesesEconomizados / 12);
        const mesesRestantesEco = mesesEconomizados % 12;
        html += `
        <div class="economia-box">
            <span class="economia-titulo">🚀 Potencial da Amortização Extra</span>
            <p style="margin: 5px 0;">Você economizará <strong>${formatarDinheiro(economiaJuros)}</strong> em juros!</p>
            <p style="margin: 5px 0;">E quitará sua dívida <strong>${anosEconomizados} anos e ${mesesRestantesEco} meses</strong> mais cedo.</p>
        </div>`;
    }

    html += '<h2>Resumo da Simulação</h2>';
    html += `<div class="grafico-container"><canvas id="graficoPizza"></canvas></div>`;

    if (tipo === 'price') {
        html += `<p>Valor da Parcela (Base): <strong>${formatarDinheiro(resultadoFinal.primeiraParcela)}</strong></p>`;
    } else {
        html += `<p>Primeira Parcela: <strong>${formatarDinheiro(resultadoFinal.primeiraParcela)}</strong></p>`;
        html += `<p>Última Parcela (estimada): <strong>${formatarDinheiro(resultadoFinal.ultimaParcela)}</strong></p>`;
    }

    if (resultadoExtra) {
        const anosFinais = Math.floor(resultadoFinal.mesesTotais / 12);
        const mesesFinais = resultadoFinal.mesesTotais % 12;
        html += `<p>Tempo Real de Pagamento: <strong>${anosFinais} anos e ${mesesFinais} meses</strong></p>`;
    }

    html += `<p>Total de Juros Pagos: <strong>${formatarDinheiro(resultadoFinal.totalJuros)}</strong></p>`;
    html += `<p>Custo Total do Imóvel: <strong>${formatarDinheiro(custoTotal)}</strong></p>`;

    container.innerHTML = html;

    const ctx = document.getElementById('graficoPizza').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Principal Financiado', 'Total de Juros'],
            datasets: [{
                data: [valorFinanciado, resultadoFinal.totalJuros],
                backgroundColor: ['#007bff', '#e74c3c'],
                borderWidth: 2, borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' }, title: { display: true, text: 'Composição do Custo Final', font: { size: 16 } } }
        }
    });
}

/* ============================================= */
/* ABA 2: CÁLCULO POR RENDA (COM GATE)          */
/* ============================================= */

document.getElementById('calc-form-renda').addEventListener('submit', function(event) {
    event.preventDefault();
    if (!verificarLead('renda')) return;

    const resultadoContainer = document.getElementById('resultado-container');
    resultadoContainer.innerHTML = '';

    const rendaMensal = limparValorMoeda(document.getElementById('renda-mensal').value);
    const percentualRenda = parseFloat(document.getElementById('percentual-renda').value);
    const taxaJurosAnual = parseFloat(document.getElementById('taxa-juros-renda').value);
    const prazoAnos = parseFloat(document.getElementById('prazo-anos-renda').value);
    const tipoAmortizacao = document.getElementById('tipo-amortizacao-renda').value;

    if (isNaN(rendaMensal) || isNaN(percentualRenda) || isNaN(taxaJurosAnual) || isNaN(prazoAnos)) {
        exibirErro("Por favor, preencha todos os campos com números válidos.");
        return; 
    }
    if (rendaMensal <= 0 || percentualRenda <= 0 || taxaJurosAnual <= 0 || prazoAnos <= 0) {
        exibirErro("Todos os valores devem ser positivos e maiores que zero.");
        return;
    }

    const parcelaMaxima = rendaMensal * (percentualRenda / 100);
    const prazoMeses = prazoAnos * 12;
    const taxaJurosMensal = (taxaJurosAnual / 100) / 12;

    const resultado = calcularPorRenda(parcelaMaxima, taxaJurosMensal, prazoMeses, tipoAmortizacao);
    exibirResultadoRenda(resultado, tipoAmortizacao);
});

function calcularPorRenda(parcelaMaxima, taxaJurosMensal, prazoMeses, tipoAmortizacao) {
    let valorFinanciado, totalJuros, totalPago;

    if (tipoAmortizacao === 'price') {
        valorFinanciado = parcelaMaxima * (Math.pow(1 + taxaJurosMensal, prazoMeses) - 1) / 
                          (taxaJurosMensal * Math.pow(1 + taxaJurosMensal, prazoMeses));
        totalPago = parcelaMaxima * prazoMeses;
        totalJuros = totalPago - valorFinanciado;
        return { type: 'Price', parcela: parcelaMaxima, valorFinanciado: valorFinanciado, totalJuros: totalJuros };
    } else { 
        valorFinanciado = parcelaMaxima / ( (1 / prazoMeses) + taxaJurosMensal );
        const amortizacao = valorFinanciado / prazoMeses;
        let saldoDevedor = valorFinanciado;
        totalJuros = 0;
        for (let i = 0; i < prazoMeses; i++) {
            const jurosDoMes = saldoDevedor * taxaJurosMensal;
            totalJuros += jurosDoMes;
            saldoDevedor -= amortizacao;
        }
        return { type: 'SAC', primeiraParcela: parcelaMaxima, valorFinanciado: valorFinanciado, totalJuros: totalJuros };
    }
}

function exibirResultadoRenda(resultado, tipo) {
    const container = document.getElementById('resultado-container');
    if (myChart) myChart.destroy();
    let html = '<h2>Resumo do Potencial (por Renda)</h2>';
    html += `<div class="grafico-container"><canvas id="graficoPizza"></canvas></div>`;
    if (tipo === 'price') {
        html += `<p>Com uma parcela fixa de <strong>${formatarDinheiro(resultado.parcela)}</strong>:</p>`;
    } else {
        html += `<p>Com uma 1ª parcela de <strong>${formatarDinheiro(resultado.primeiraParcela)}</strong> (SAC):</p>`;
    }
    html += `<p>Você pode financiar até: <strong>${formatarDinheiro(resultado.valorFinanciado)}</strong></p>`;
    html += `<p>Total de juros pagos ao final: <strong>${formatarDinheiro(resultado.totalJuros)}</strong></p>`;
    html += `<br><p style="font-size: 0.9em; color: #555;">(Este valor não inclui o valor da entrada).</p>`;

    container.innerHTML = html;
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Potencial de Financiamento', 'Total de Juros Estimados'],
            datasets: [{
                data: [resultado.valorFinanciado, resultado.totalJuros],
                backgroundColor: ['#28a745', '#e74c3c'],
                borderColor: '#fff', borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' }, title: { display: true, text: 'Poder de Compra vs. Juros', font: { size: 16 } } }
        }
    });
}

/* ============================================= */
/* MÁSCARA DE MOEDA EM TEMPO REAL               */
/* ============================================= */
function formatarMoedaTempoReal(e) {
    let value = e.target.value.replace(/\D/g, ""); 
    if (value === "") { e.target.value = ""; return; }
    let numero = parseFloat(value) / 100;
    e.target.value = numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

document.getElementById('valor-imovel').addEventListener('input', formatarMoedaTempoReal);
document.getElementById('valor-entrada').addEventListener('input', formatarMoedaTempoReal);
document.getElementById('valor-extra').addEventListener('input', formatarMoedaTempoReal);
document.getElementById('renda-mensal').addEventListener('input', formatarMoedaTempoReal);