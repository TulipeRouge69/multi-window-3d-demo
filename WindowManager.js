class WindowManager {
    #windows;
    #id;
    #winData;
    #winShapeChangeCallback;
    #winChangeCallback;

    constructor() {
        let that = this;

        addEventListener("storage", (event) => {
            if (event.key == "windows") {
                let newWindows = JSON.parse(event.newValue);
                let winChange = that.#didWindowsChange(that.#windows, newWindows);
                that.#windows = newWindows;
                if (winChange && that.#winChangeCallback) that.#winChangeCallback();
            }
        });

        window.addEventListener('beforeunload', () => {
            let windows = JSON.parse(localStorage.getItem("windows")) || [];
            let index = windows.findIndex(w => w.id === this.#id);
            if (index !== -1) {
                windows.splice(index, 1);
                // Si c'est la dernière fenêtre, on peut reset le compteur
                if (windows.length === 0) localStorage.setItem("count", 0);
                localStorage.setItem("windows", JSON.stringify(windows));
            }
        });
    }

    #didWindowsChange(pWins, nWins) {
        if (pWins.length !== nWins.length) return true;
        return JSON.stringify(pWins) !== JSON.stringify(nWins);
    }

    init(metaData) {
        this.#windows = JSON.parse(localStorage.getItem("windows")) || [];
        let count = parseInt(localStorage.getItem("count") || 0);
        count++;
        
        this.#id = count;
        localStorage.setItem("count", count);

        this.#winData = { id: this.#id, shape: this.getWinShape(), metaData: metaData };
        this.#windows.push(this.#winData);
        
        this.updateWindowsLocalStorage();
    }

    getWinShape() {
        return {
            x: window.screenLeft,
            y: window.screenTop,
            w: window.innerWidth,
            h: window.innerHeight
        };
    }

    updateWindowsLocalStorage() {
        localStorage.setItem("windows", JSON.stringify(this.#windows));
    }

    update() {
        let winShape = this.getWinShape();

        if (winShape.x !== this.#winData.shape.x || 
            winShape.y !== this.#winData.shape.y ||
            winShape.w !== this.#winData.shape.w ||
            winShape.h !== this.#winData.shape.h) {
            
            this.#winData.shape = winShape;
            let index = this.#windows.findIndex(w => w.id === this.#id);
            if (index !== -1) {
                this.#windows[index].shape = winShape;
                this.updateWindowsLocalStorage();
                if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
            }
        }
    }

    setWinChangeCallback(cb) { this.#winChangeCallback = cb; }
    setWinShapeChangeCallback(cb) { this.#winShapeChangeCallback = cb; }
    getWindows() { return this.#windows; }
    getThisWindowID() { return this.#id; }
}

export default WindowManager;
