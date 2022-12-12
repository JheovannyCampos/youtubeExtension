class YoutubeHelper {
  constructor() {
    this.tab = undefined;
    this.buttonTimer = undefined;
    this.buttonFavorite = undefined;
    this.timerHtml = undefined;
    this.favoriteHtml = undefined;
    this.favoriteWrapper = undefined;
    this.favoriteArray = [];
    this.init();
  }

  async init() {
    this.buttonTimer = document.getElementById("buttonTimer");
    this.buttonTimer.removeEventListener("click", () => {});
    this.buttonTimer.addEventListener("click", () => {
      this.showFunction("timer");
    });
    this.buttonFavorite = document.getElementById("buttonFavorite");
    this.buttonFavorite > removeEventListener("click", () => {});
    this.buttonFavorite.addEventListener("click", () => {
      this.showFunction("favorite");
    });

    await this.getTab();
    await this.timerEvents();
    await this.favoriteEvent();
  }

  async favoriteEvent() {
    this.favoriteWrapper = document.getElementById("favoriteWrapper");
    this.addFavorite = document.getElementById("save-favorite-button");
    const deleteFavorite = document.getElementById("delete-all-button");

    deleteFavorite.removeEventListener("click", () => {});
    deleteFavorite.addEventListener("click", () => {
      this.favoriteArray = [];
      this.removeAllFavoriteLink();
    });

    this.addFavorite.addEventListener("click", () => {
      this.addFavoriteLink();
    });
    this.addFavorite.removeEventListener("click", () => {});
  }

  async timerEvents() {
    this.startTimer = document.getElementById("start-timer-button");
    this.startTimer.addEventListener("click", () => {
      this.interval.clearInterval();
      const hours = document.getElementById("hours").value;
      const minutes = document.getElementById("minutes").value;

      const time = hours * 60 * 60 + minutes * 60;

      if (!time) {
        alert("Você precisa informar um tempo");
        return;
      }

      this.interval = setInterval(() => {
        alert(`Você está assistindo a um vídeo há ${time}`);
      }, time * 1000);
    });

    this.stopTimer = document.getElementById("stop-timer-button");
    this.stopTimer.addEventListener("click", () => {});
  }

  async getTab() {
    [this.tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.storage.sync.get("favoriteArray", (result) => {
      this.favoriteArray.push(...result.favoriteArray);
    });
  }

  async removeAllFavoriteLink() {
    const resp = window.confirm(
      "Você tem certeza que deseja remover todos os favoritos?"
    );
    if (resp) {
      this.favoriteArray = [];
      await chrome.storage.sync.set({ favoriteArray: this.favoriteArray });
      console.log("this.favoriteArray", this.favoriteArray);
      this.favoriteWrapper.innerHTML = await this.createFavoriteHtml();
    }
  }

  async addFavoriteLink() {
    const { title, url } = this.tab;

    const alreadyExists = this.favoriteArray.filter((item) => item.url === url);

    console.log("alreadyExists", alreadyExists);

    if (alreadyExists.length) {
      alert("Este vídeo já está nos favoritos");
      return;
    }

    this.favoriteArray.push({ title, url });
    chrome.storage.sync.set({ favoriteArray: this.favoriteArray });

    this.favoriteWrapper.innerHTML = await this.createFavoriteHtml();

    const favoriteItem = document.querySelectorAll("#favoriteLink");
    console.log("favoriteItem", favoriteItem);

    favoriteItem.addEventListener("click", (e) => {
      chrome.tabs.create({ url: favoriteItem.href });
    });
  }

  createFavoriteHtml() {
    return this.favoriteArray && this.favoriteArray.length
      ? this.favoriteArray.map((item) => {
          return `
        <li>
          <div class="col-12" style="border-bottom: 1px solid #000">
            <span>
              <a id="favoriteLink" href="${item.url}">${item.title}</a>
            </span>
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
        if (this.favoriteHtml) this.favoriteHtml.hidden = true;
        this.timerHtml.hidden = false;
        break;
      case "favorite":
        this.favoriteHtml = document.getElementById("favoriteContent");
        if (this.timerHtml) this.timerHtml.hidden = true;
        this.favoriteHtml.hidden = false;
        this.favoriteWrapper.innerHTML = this.createFavoriteHtml();
      default:
        break;
    }
  }
}

export default YoutubeHelper;
