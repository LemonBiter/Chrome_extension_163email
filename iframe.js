class StorageHelper {
  constructor() {}

  getCurrentFromDataBase() {
    let selectedAccount = new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({selectedAccount:"selectedAccount"}, (data) => {
       resolve(data);
      });
    });
    return selectedAccount;
  }

  getDate(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  setData(request) {
    chrome.storage.local.set(JSON.parse(request));
  }

  listen(callback, targetEl) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.setData(request);
      let value = JSON.parse(request);

      callback(value.enableLogin, targetEl);
    });
  }
}

//维护单一button
class SubmitButton {
  constructor() {
    const rooEl = document.createElement("button");
    this.rooEl = rooEl;
    this.updateBtnText("一键登录");
    this.btnStyling();

    //将点击事件传给父级
    this.rooEl.addEventListener("click", () => {
      this.onClick();
    });

    document.body.before(this.rooEl);
  }

  //更改内容
  updateBtnText(text) {
    this.rooEl.innerText = text;
  }
  //通过class 添加按钮样式
  btnStyling() {
    this.rooEl.className += " submitBtn";
  }
}

class App {
  constructor() {
    this.initAutoLoginBtn();
  }

  //初始化登录按钮
  initAutoLoginBtn() {
    // 新建按钮，添加点击事件
    const submitBtn = new SubmitButton();
    submitBtn.onClick = () => {
      this.handleSubmitClick();
    };
    this.submitBtn = submitBtn;
    //初始化按钮显示
    this.initBtnDisplay();
  }

  handleSubmitClick() {
    //从数据库拿取当前账号的信息, 执行登录操作
    let getInfo = new StorageHelper();

    getInfo.getCurrentFromDataBase().then((account) => {
      this.checkAccountExist(account);
      this.applySelectedAccount(account);
    });
  }

  checkAccountExist({ currentAccount }) {
    if (!currentAccount["account"]) {
      this.submitBtn.updateBtnText("未选中账号");
      setTimeout(() => {
        this.submitBtn.updateBtnText("一键登录");
      }, 2 * 1000);
    } else {
      this.submitBtn.updateBtnText("登录中...");
      setTimeout(() => {
        this.submitBtn.updateBtnText("一键登录");
      }, 2 * 1000);
    }
  }

  applySelectedAccount({ currentAccount }) {
    if (!currentAccount.account) return;
    this.initTargetEl();
    this.targetAccountInputEl.value = currentAccount["account"];
    this.targetPwdInputEl.value = currentAccount["password"];
    this.targetLoginBtnEl.click();
  }

  //初始化登录框等元素
  initTargetEl() {
    const targetAccountInputEl = document.querySelectorAll("input")[0];
    const targetPwdInputEl = document.querySelector("input[name='password']");
    const targetLoginBtnEl = document.querySelector("#dologin");
    this.targetAccountInputEl = targetAccountInputEl;
    this.targetPwdInputEl = targetPwdInputEl;
    this.targetLoginBtnEl = targetLoginBtnEl;
  }

  //初始化按钮显示，同时监听按钮显示变化
  initBtnDisplay() {
    let enableLogin = new StorageHelper();
    enableLogin
      .getDate("enableLogin")
      .then((value) => this.changeBtnDisplay(value, this.submitBtn));
    this.btnDisplayListener();
  }

  btnDisplayListener() {
    let enableLogin = new StorageHelper();
    enableLogin.listen(this.changeBtnDisplay, this.submitBtn);
  }

  changeBtnDisplay(value, btnEl) {
    btnEl.rooEl.style.display = value ? "block" : "none";
  }
}

//主入口
new App();
