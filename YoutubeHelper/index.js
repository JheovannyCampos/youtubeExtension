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
    this.buttonTimer = document.getElementById("buttonTimer");
    this.buttonTimer.addEventListener("click", () => {
      this.showFunction("timer");
    });
    this.buttonFavorite = document.getElementById("buttonFavorite");
    this.buttonFavorite.addEventListener("click", () => {
      this.showFunction("favorite");
    });

    this.buttonMarker = document.getElementById("buttonMarker");
    this.buttonMarker.addEventListener("click", () => {
      this.showFunction("marker");
    });

    await this.getTab();
    await this.timerEvents();
    await this.favoriteEvents();
    await this.markerEvents();
  }

  async getTab() {
    [this.tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.storage.sync.get("favoriteArray", (result) => {
      this.favoriteArray.push(...result.favoriteArray);
    });
    await chrome.storage.sync.get("videoMarkerArray", (result) => {
      this.videoMarkerArray.push(...result.videoMarkerArray);
    });
    console.log("this.videoMarkerArray", this.videoMarkerArray);
  }

  async timerEvents() {
    const startTimer = document.getElementById("start-timer-button");
    const stopTimer = document.getElementById("stop-timer-button");

    stopTimer.addEventListener("click", () => {
      chrome.scripting.executeScript({
        target: { tabId: this.tab.id },
        function: () => {
          alert("Contador finalizado");
        },
      });
    });

    startTimer.addEventListener("click", () => {
      const hours = document.getElementById("hours").value;
      const minutes = document.getElementById("minutes").value;
      const time = hours * 60 * 60 + minutes * 60;
      alert("Contador iniciado");
      chrome.scripting.executeScript({
        target: { tabId: this.tab.id },
        function: () => {
          if (!time) {
            alert("Por favor, insira um tempo válido");
            return;
          }

          setTimeout(() => {
            alert("Contador finalizado");
          }, time * 1000);
        },
      });
    });
  }

  startTimerFunction = (time) => {};

  async markerEvents() {
    const addMarker = document.getElementById("save-marker-button");
    this.markerWrapper = document.getElementById("markerWrapper");
    addMarker.addEventListener("click", () => {
      this.addMarkerLink();
    });
  }

  async addMarkerLink() {
    [this.videoTimeMarker] = await chrome.scripting.executeScript({
      target: { tabId: this.tab.id },
      function: () => document.querySelector("video").currentTime,
    });
    console.log("this.videoTimeMarker", this.videoTimeMarker);
    const idVideo = this.videoTimeMarker.documentId;
    const [timeVideo] = this.videoTimeMarker.result.toString().split(".");

    this.videoMarkerArray.push({ idVideo, timeVideo });
    await chrome.storage.sync.set({ videoMarkerArray: this.videoMarkerArray });
    this.markerWrapper.innerHTML = this.createMarkerHtml();
    this.openMarkerLink();
  }

  openMarkerLink() {
    const markerLink = document.querySelectorAll("a.markerLink");
    markerLink.forEach((item) => {
      item.addEventListener("click", () => {
        chrome.tabs.create({ url: item.href });
      });
    });
  }

  createMarkerHtml() {
    return this.videoMarkerArray.map(
      (item) =>
        `
        <div class="markerLinkWrapper col-12">
          <a 
            href="${this.tab.url + `&t=${item.timeVideo}`}" 
            id="${item.id}" 
            class="markerLink"
          >
            ${item.timeVideo}
          </a>
          <img src="assets/delete.png" class="deletemarker" />
        </div>
      `
    );
  }

  async favoriteEvents() {
    this.favoriteWrapper = document.getElementById("favoriteWrapper");
    this.addFavorite = document.getElementById("save-favorite-button");
    const deleteFavorite = document.getElementById("delete-all-button");

    deleteFavorite.addEventListener("click", () => {
      this.favoriteArray = [];
      this.removeAllFavoriteLink();
    });

    this.addFavorite.addEventListener("click", () => {
      this.addFavoriteLink();
    });
  }

  async removeAllFavoriteLink() {
    if (!this.favoriteArray.length) {
      alert("Não há favoritos para remover");
      return;
    }
    const resp = window.confirm(
      "Você tem certeza que deseja remover todos os favoritos?"
    );
    if (resp) {
      this.favoriteArray = [];
      await chrome.storage.sync.set({ favoriteArray: this.favoriteArray });
    }
    this.favoriteWrapper.innerHTML = await this.createFavoriteHtml();
  }

  openFavoriteLink() {
    const favoriteLink = document.querySelectorAll("a.favoriteLink");
    favoriteLink.forEach((item) => {
      item.addEventListener("click", () => {
        chrome.tabs.create({ url: item.href });
      });
    });
  }

  deleteFavoriteLink() {
    const deleteFavorite = document.querySelectorAll("img.deleteFavorite");
    deleteFavorite.forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.parentNode.querySelector("a").id;
        const resp = window.confirm(
          "Você tem certeza que deseja remover este favorito?"
        );
        if (resp) {
          this.favoriteArray = this.favoriteArray.filter(
            (item) => item.id !== id
          );
          chrome.storage.sync.set({ favoriteArray: this.favoriteArray });
          this.favoriteWrapper.innerHTML = this.createFavoriteHtml();
          this.openFavoriteLink();
          this.deleteFavoriteLink();
        }
      });
    });
  }

  async addFavoriteLink() {
    const { title, url } = this.tab;
    const [, id] = url.split("=");
    const alreadyExists = this.favoriteArray.filter((item) => item.id === id);

    if (alreadyExists.length) {
      alert("Este vídeo já está nos favoritos");
      return;
    }

    this.favoriteArray.push({ id, title, url });
    chrome.storage.sync.set({ favoriteArray: this.favoriteArray });

    this.favoriteWrapper.innerHTML = await this.createFavoriteHtml();
    this.openFavoriteLink();
    this.deleteFavoriteLink();
  }

  createFavoriteHtml() {
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

  async showFunction(functionName) {
    switch (functionName) {
      case "timer":
        this.timerHtml = document.getElementById("timerContent");

        if (this.favoriteHtml && !this.favoriteHtml.hidden) {
          this.favoriteHtml.hidden = true;
        } else if (this.markerHtml && !this.markerHtml.hidden) {
          this.markerHtml.hidden = true;
        }
        this.timerHtml.hidden = false;
        break;
      case "favorite":
        this.favoriteHtml = document.getElementById("favoriteContent");
        if (this.timerHtml && !this.timerHtml.hidden) {
          this.timerHtml.hidden = true;
        } else if (this.markerHtml && !this.markerHtml.hidden) {
          this.markerHtml.hidden = true;
        }
        this.favoriteHtml.hidden = false;
        this.favoriteWrapper.innerHTML = this.createFavoriteHtml();
        this.openFavoriteLink();
        this.deleteFavoriteLink();
        break;
      case "marker":
        this.markerHtml = document.getElementById("markerContent");
        if (this.timerHtml && !this.timerHtml.hidden) {
          this.timerHtml.hidden = true;
        } else if (this.favoriteHtml && !this.favoriteHtml.hidden) {
          this.favoriteHtml.hidden = true;
        }
        this.markerHtml.hidden = false;

        this.markerWrapper.innerHTML = this.createMarkerHtml();
        this.openMarkerLink();
        break;

      default:
        break;
    }
  }
}

export default YoutubeHelper;
