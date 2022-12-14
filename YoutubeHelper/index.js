class YoutubeHelper {
  constructor() {
    this.tab = undefined;
    this.buttonTimer = undefined;
    this.buttonFavorite = undefined;
    this.timerHtml = undefined;
    this.favoriteHtml = undefined;
    this.favoriteWrapper = undefined;
    this.favoriteArray = [];
    this.markersWrapper = undefined;
    this.videoTimeMarker = undefined;
    this.videoMarkerArray = [];
    this.init();
  }

  async init() {
    this.loadButtons();
    await this.getData();
    await this.timerEvents();
    await this.favoriteEvents();
    await this.markerEvents();
  }

  // Função adicionar eventos aos botões
  loadButtons() {
    // Adiciona evento ao botão timer
    this.buttonTimer = document.getElementById("buttonTimer");
    this.buttonTimer.addEventListener("click", () => {
      this.showFunction("timer");
    });

    // Adiciona evento ao botão favoritos
    this.buttonFavorite = document.getElementById("buttonFavorite");
    this.buttonFavorite.addEventListener("click", () => {
      this.showFunction("favorite");
    });

    // Adiciona evento ao botão marcadores
    this.buttonMarker = document.getElementById("buttonMarker");
    this.buttonMarker.addEventListener("click", () => {
      this.showFunction("marker");
    });
  }

  // Função para obter os dados do storage e a aba ativa
  async getData() {
    // Obtem a aba ativa
    [this.tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Obtem os favoritos salvo no storage
    await chrome.storage.sync.get("favoriteArray", (result) => {
      this.favoriteArray.push(...result.favoriteArray);
    });

    // Obtem os marcadores salvo no storage
    await chrome.storage.sync.get("videoMarkerArray", (result) => {
      this.videoMarkerArray.push(...result.videoMarkerArray);
    });
  }

  // Função para adicionar eventos da função timer
  async timerEvents() {
    // Adiciona evento ao botão iniciar timer
    const startTimer = document.getElementById("start-timer-button");

    startTimer.addEventListener("click", () => {
      // Obtem o tempo inserido pelo usuário
      const hours = document.getElementById("hours").value;
      const minutes = document.getElementById("minutes").value;
      // Converte o tempo inserido para segundos
      const time = hours * 60 * 60 + minutes * 60;

      // Verifica se o tempo inserido é válido
      if (!time) {
        alert("Por favor, insira um tempo válido");
        return;
      }

      // Inicia o timer
      alert("Contador iniciado");

      // Executa a função startTimerFunction no contexto da aba ativa
      chrome.scripting.executeScript({
        target: { tabId: this.tab.id },
        function: (time) => {
          setTimeout(() => {
            alert("O seu tempo acabou!");
            window.clearTimeout();
          }, time * 1000);
        },
        args: [time],
      });
    });
  }

  // Função para adicionar eventos da função favoritos
  async markerEvents() {
    // Obtem o botão adicionar marcador
    const addMarker = document.getElementById("save-marker-button");

    // Obtem o botão remover todos os marcadores
    const deleteAllMarker = document.getElementById("delete-all-marker-button");

    // Adiciona evento ao botão remover todos os marcadores
    deleteAllMarker.addEventListener("click", () => {
      this.deleteAllMarkerLink();
    });

    // Carrega a div que contém os marcadores
    this.markerWrapper = document.getElementById("markerWrapper");

    // Adiciona evento ao botão adicionar marcador
    addMarker.addEventListener("click", () => {
      this.addMarkerLink();
    });
  }

  // Função para adicionar eventos da função favoritos
  async addMarkerLink() {
    // Solicita ao usuário um nome para o marcador
    const labelMarker = prompt("Insira um nome para o marcador");

    // Obtem o tempo atual do vídeo
    [this.videoTimeMarker] = await chrome.scripting.executeScript({
      target: { tabId: this.tab.id },
      function: () => document.querySelector("video").currentTime,
    });

    // Obtem o id do vídeo
    const idVideo = this.videoTimeMarker.documentId.toString();

    // Obtem o tempo do vídeo
    const timeVideo = this.videoTimeMarker.result.toString();

    //Adiciona o marcador ao array de marcadores
    this.videoMarkerArray.push({
      idVideo,
      timeVideo,
      label: labelMarker,
      title: this.tab.title,
      url: this.tab.url,
    });
    // Salva o array de marcadores no storage
    await chrome.storage.sync.set({ videoMarkerArray: this.videoMarkerArray });

    // Atualiza a div que contém os marcadores e os eventos dos botões
    this.markerWrapper.innerHTML = this.createMarkerHtml();
    this.openMarkerLink();
    this.deleteMarkerLink();
  }

  // Funcão que deleta todos os marcadores
  async deleteAllMarkerLink() {
    // Verifica se há marcadores para remover
    if (!this.videoMarkerArray.length) {
      alert("Não há marcadores para remover");
      return;
    }

    // Solicita confirmação para remover todos os marcadores
    const resp = window.confirm(
      "Você tem certeza que deseja remover todos os marcadores?"
    );

    // Remove todos os marcadores
    if (resp) {
      // Limpa o array de marcadores
      this.videoMarkerArray = [];

      // Salva o array de marcadores no storage
      await chrome.storage.sync.set({
        videoMarkerArray: this.videoMarkerArray,
      });
      // Atualiza a div que contém os marcadores
      this.markerWrapper.innerHTML = this.createMarkerHtml();
    }
  }

  // Função que deleta um marcador
  deleteMarkerLink() {
    // Obtem todos os botões de remover marcador
    const deleteMarker = document.querySelectorAll("img.deletemarker");

    // Percorre todos os botões de remover marcador e adiciona evento
    deleteMarker.forEach((item) => {
      item.addEventListener("click", () => {
        // Obtem o id do marcador
        const id = item.parentNode.querySelector(`a`).id;

        // Solicita confirmação para remover o marcador
        const resp = window.confirm(
          "Você tem certeza que deseja remover este marcador?"
        );

        if (resp) {
          // Remove o marcador do array de marcadores
          this.videoMarkerArray = this.videoMarkerArray.filter(
            (item) => item.idVideo + item.timeVideo !== id
          );

          // Salva o array de marcadores no storage
          chrome.storage.sync.set({ videoMarkerArray: this.videoMarkerArray });

          // Atualiza a div que contém os marcadores e os eventos dos botões
          this.markerWrapper.innerHTML = this.createMarkerHtml();
          this.openMarkerLink();
          this.deleteMarkerLink();
        }
      });
    });
  }

  // Função que abre o marcador
  openMarkerLink() {
    // Obtem todos os links dos marcadores
    const markerLink = document.querySelectorAll("a.markerLink");
    // Percorre todos os links dos marcadores e adiciona evento
    markerLink.forEach((item) => {
      item.addEventListener("click", () => {
        // Abre o link do marcador em uma nova aba
        chrome.tabs.create({ url: item.href });
      });
    });
  }

  // Função que cria a div que contém os marcadores
  createMarkerHtml() {
    // Verifica se há marcadores para exibir
    return this.videoMarkerArray.length
      ? this.videoMarkerArray.map((item) => {
          // Formata o id do marcador
          const [idFormated] = item.timeVideo.toString().split(".");
          return `
        <div 
          class="markerLinkWrapper col-12 d-flex align-items-center justify-content-between" 
          style="
            text-overflow: ellipsis;
            flex-direction: column;
            "
        >
            <p class="markerTitle" style="width: 260px;
            font-size: 15px;
            vertical-align: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;"
            >
              ${item.title}
            </p>
          <div id="${
            item.timeVideo
          }" class="sameVideo row" style="width: 285px; align-items: center; justify-content: space-between;">
          <a 
            href="${item.url + `&t=${idFormated}`}" 
            id="${item.idVideo + item.timeVideo}" 
            class="markerLink"
          >
            ${this.formatVideoTime(item.timeVideo)}
          </a>
          <input type="text" value="${
            item.label ? item.label : "Sem nome"
          }" class="markerLabel" style="width" disabled/>
          <img src="assets/trash.png" style="width: 20px; height: 20px; cursor: pointer" class="deletemarker" />
          </div>
        </div>
      `;
        })
      : `<p class="noMarker">Não há marcadores</p>`;
  }

  //Adiciona os eventos dos botões de favoritos
  async favoriteEvents() {
    // Obtem a div que contém os favoritos
    this.favoriteWrapper = document.getElementById("favoriteWrapper");
    // Obtem o botão de adicionar favorito
    this.addFavorite = document.getElementById("save-favorite-button");
    // Obtem o botão de remover todos os favoritos
    const deleteAllFavorite = document.getElementById("delete-all-button");

    // Adiciona evento ao botão de remover todos os favoritos
    deleteAllFavorite.addEventListener("click", () => {
      // Limpa o array de favoritos
      this.favoriteArray = [];
      // Executa a função que remove todos os favoritos
      this.removeAllFavoriteLink();
    });

    // Adiciona evento ao botão de adicionar favorito
    this.addFavorite.addEventListener("click", () => {
      // Executa a função que adiciona um favorito
      this.addFavoriteLink();
    });
  }

  // Função que remove todos os favoritos
  async removeAllFavoriteLink() {
    // Verifica se há favoritos para remover
    if (!this.favoriteArray.length) {
      alert("Não há favoritos para remover");
      return;
    }
    // Solicita confirmação para remover todos os favoritos
    const resp = window.confirm(
      "Você tem certeza que deseja remover todos os favoritos?"
    );
    if (resp) {
      // Limpa o array de favoritos
      this.favoriteArray = [];
      // Salva o array de favoritos no storage
      await chrome.storage.sync.set({ favoriteArray: this.favoriteArray });
    }
    // Atualiza a div que contém os favoritos e os eventos dos botões
    this.favoriteWrapper.innerHTML = await this.createFavoriteHtml();
  }

  // Função que abre um favorito
  openFavoriteLink() {
    // Obtem todos os links dos favoritos
    const favoriteLink = document.querySelectorAll("a.favoriteLink");
    // Percorre todos os links dos favoritos e adiciona evento
    favoriteLink.forEach((item) => {
      item.addEventListener("click", () => {
        // Abre o link do favorito em uma nova aba
        chrome.tabs.create({ url: item.href });
      });
    });
  }

  // Função que deleta um favorito
  deleteFavoriteLink() {
    // Obtem todos os botões de deletar favorito
    const deleteFavorite = document.querySelectorAll("img.deleteFavorite");
    // Percorre todos os botões de deletar favorito e adiciona evento
    deleteFavorite.forEach((item) => {
      item.addEventListener("click", () => {
        // Obtem o id do favorito
        const id = item.parentNode.querySelector("a").id;
        // Solicita confirmação para remover o favorito
        const resp = window.confirm(
          "Você tem certeza que deseja remover este favorito?"
        );
        if (resp) {
          // Remove o favorito do array de favoritos
          this.favoriteArray = this.favoriteArray.filter(
            (item) => item.id !== id
          );
          // Salva o array de favoritos no storage
          chrome.storage.sync.set({ favoriteArray: this.favoriteArray });
          // Atualiza a div que contém os favoritos e os eventos dos botões
          this.favoriteWrapper.innerHTML = this.createFavoriteHtml();
          this.openFavoriteLink();
          this.deleteFavoriteLink();
        }
      });
    });
  }

  // Função que adiciona um favorito
  async addFavoriteLink() {
    // Obtem o título e a url da aba atual
    const { title, url } = this.tab;
    // Obtem o id do vídeo
    const [, id] = url.split("=");
    // Verifica se o vídeo já está nos favoritos
    const alreadyExists = this.favoriteArray.filter((item) => item.id === id);

    // Se o vídeo já estiver nos favoritos, exibe uma mensagem de erro
    if (alreadyExists.length) {
      alert("Este vídeo já está nos favoritos");
      return;
    }

    // Adiciona o favorito no array de favoritos
    this.favoriteArray.push({ id, title, url });
    // Salva o array de favoritos no storage
    chrome.storage.sync.set({ favoriteArray: this.favoriteArray });

    // Atualiza a div que contém os favoritos e os eventos dos botões
    this.favoriteWrapper.innerHTML = await this.createFavoriteHtml();
    this.openFavoriteLink();
    this.deleteFavoriteLink();
  }

  // Função que cria o html dos favoritos
  createFavoriteHtml() {
    // Verifica se há favoritos para exibir
    return this.favoriteArray && this.favoriteArray.length
      ? this.favoriteArray.map((item) => {
          return `
        <li>
          <div 
            class="col-12 d-flex align-items-center justify-content-around" 
            style="border-bottom: 1px solid #000"
          >
              <h6>
                <a id="${item.id}" class="favoriteLink" href="${item.url}">${item.title}</a>
              </h6>
              <img 
                src="assets/trash.png" 
                class="deleteFavorite" 
                style="width: 20px; height: 20px; cursor: pointer" 
                title="Remover favorito"
              />
          </div>
        </li>
      `;
        })
      : "<p>Você não possui nenhum favorito</p>";
  }

  // Função para formatar o tempo do vídeo em horas, minutos e segundos
  formatVideoTime = (time) => {
    const timeFormated = Number(time);
    let h = Math.floor(timeFormated / 3600);
    let m = Math.floor((timeFormated % 3600) / 60);
    let s = Math.floor((timeFormated % 3600) % 60);
    let hDisplay = h > 0 ? h + ":" : "";
    let mDisplay = m > 0 ? m : "00";
    let sDisplay = s > 0 ? ":" + s : "";
    return hDisplay + mDisplay + sDisplay;
  };

  // Função que exibe a determinada função na tela
  async showFunction(functionName) {
    // Verifica qual função deve ser exibida
    switch (functionName) {
      // Caso seja a função de Timer
      case "timer":
        // Obtem o html do timer
        this.timerHtml = document.getElementById("timerContent");

        // Oculta os outros htmls
        if (this.favoriteHtml && !this.favoriteHtml.hidden) {
          this.favoriteHtml.hidden = true;
        } else if (this.markerHtml && !this.markerHtml.hidden) {
          this.markerHtml.hidden = true;
        }
        // Exibe o html do timer
        this.timerHtml.hidden = false;
        break;
      // Caso seja a função de Favoritos
      case "favorite":
        // Obtem o html dos favoritos
        this.favoriteHtml = document.getElementById("favoriteContent");
        // Oculta os outros htmls
        if (this.timerHtml && !this.timerHtml.hidden) {
          this.timerHtml.hidden = true;
        } else if (this.markerHtml && !this.markerHtml.hidden) {
          this.markerHtml.hidden = true;
        }
        // Exibe o html dos favoritos
        this.favoriteHtml.hidden = false;
        // Atualiza a div que contém os favoritos e os eventos dos botões
        this.favoriteWrapper.innerHTML = this.createFavoriteHtml();
        this.openFavoriteLink();
        this.deleteFavoriteLink();
        break;
      // Caso seja a função de Marcadores
      case "marker":
        // Obtem o html dos marcadores
        this.markerHtml = document.getElementById("markerContent");
        // Oculta os outros htmls
        if (this.timerHtml && !this.timerHtml.hidden) {
          this.timerHtml.hidden = true;
        } else if (this.favoriteHtml && !this.favoriteHtml.hidden) {
          this.favoriteHtml.hidden = true;
        }
        // Exibe o html dos marcadores
        this.markerHtml.hidden = false;

        // Atualiza a div que contém os marcadores e os eventos dos botões
        this.markerWrapper.innerHTML = this.createMarkerHtml();
        this.openMarkerLink();
        this.deleteMarkerLink();
        break;

      default:
        break;
    }
  }
}

export default YoutubeHelper;
