// js/auth.js

/**
 * Salva os dados da sessão do usuário no localStorage.
 * @param {{ id: string, name: string }} param0
 */
export function salvarSessao({ id, name }) {
  const sessao = {
    userId: id,
    userName: name,
    timestamp: Date.now()
  };
  localStorage.setItem('sessaoUsuario', JSON.stringify(sessao));
}

/**
 * Limpa localStorage, sessionStorage e redireciona para a tela inicial.
 */
export function logout() {
  localStorage.clear();
  sessionStorage.clear();

  // Flag para indicar que foi logout manual
  sessionStorage.setItem("logoutManual", "true");

  window.location.href = 'index.html';
}


/**
 * Verifica se a sessão do usuário é válida.
 * Se inválida, exibe mensagem amigável e redireciona.
 * 
 * IMPORTANTE:
 * Caso deseje controlar manualmente o redirecionamento, comente a linha `forcarRedirecionamento()`.
 */
export async function verificarLoginObrigatorio() {
  const dadosBrutos = localStorage.getItem("sessaoAcademyTools");

  if (!dadosBrutos) {
    console.warn("⚠️ Sessão não encontrada.");

    // Garante que isso só acontece se **não estiver na própria tela de login**
    const jaEstaNoLogin = location.pathname.includes("index.html");

    if (!jaEstaNoLogin) {
      // Redireciona de forma elegante
      mostrarMensagemSessaoInvalida();
    }

    return null;
  }

  try {
    const dados = JSON.parse(dadosBrutos);

    if (!dados.userId) throw new Error("Sessão inválida: sem userId");

    return dados;

  } catch (erro) {
    console.error("❌ Erro ao validar sessão:", erro);
    mostrarMensagemSessaoInvalida();
    return null;
  }
}



function mostrarMensagemSessaoInvalida() {
  document.body.innerHTML = `
    <div style="font-family: sans-serif; text-align: center; padding: 5rem;">
      <h1 style="font-size: 2rem; color: #1e3a8a;">🔒 Sessão inválida ou expirada</h1>
      <p style="margin-top: 1rem; color: #444;">Você será redirecionado para a tela de login em 5 segundos.</p>
    </div>
  `;

  // Caso esteja rodando dentro de um iframe
  if (window.top !== window.self) {
    setTimeout(() => {
      window.parent.postMessage({ tipo: "logout" }, "*");
    }, 5000);
  } else {
    // Se estiver acessando diretamente (sem iframe)
    setTimeout(() => {
      if (!location.pathname.includes("index.html")) {
        window.location.href = "index.html";
      }
    }, 5000);
  }
}



