/************************************************************** */

class TopButton {
  constructor() {
    this.init();
  }

  init() {
    this.initBtn();
    this.checkUrlEqualTo163();
    this.checkBtnOnOff();
    this.clickEventBind();
  }

  initBtn() {
    const autoLoginBtn = document.getElementById("allowAutoLogin"); //popup上的自动登录打开按钮
    autoLoginBtn.disabled = true;
    this.autoLoginBtn = autoLoginBtn;
  }

  checkUrlEqualTo163() {
    const autoLoginBtn = this.autoLoginBtn;
    //判定当前页面是否为163 email，自动登陆按钮是否可以点击
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      function (tabs) {
        if (/:\/\/mail.163.com\/*/g.test(tabs[0].favIconUrl)) {
          autoLoginBtn.disabled = false;
        }
      }
    );
  }

  checkBtnOnOff() {
    const topBtn = this;
    chrome.storage.local.get(["open"],result =>{
      topBtn.autoLoginBtn.checked =
      result["open"] === undefined ? false : result["open"];
    })
  }

  clickEventBind() {
    this.autoLoginBtn.addEventListener("click", () => {
      chrome.storage.local.set({ open: this.autoLoginBtn.checked });

      let displayBtn = { enableLogin: this.autoLoginBtn.checked };

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, JSON.stringify(displayBtn));
      });
    });
  }
}

class InputArea {
  constructor() {
    this.init();
  }

  init() {
    const accountInput = document.getElementById("account"); //输入的用户名
    const passwordInput = document.getElementById("password"); //输入的密码
    const addBtn = document.getElementById("add"); //添加用户按钮
    this.accountInput = accountInput;
    this.passwordInput = passwordInput;
    this.addBtn = addBtn;
    this.clickEventBinding();
  }

  clickEventBinding() {
    //监听到回车触发事件
    document.addEventListener("keyup", (e) => {
      e.key === "Enter" && this.accountAdding();
    });

    //监听到按钮点击，触发事件

    this.addBtn.addEventListener("click", () => this.accountAdding());
  }

  accountAdding() {
    if (this.accountInput.value && this.passwordInput.value) {
      //根据输入的信息生成用户数据，发送到background 数据库
      let newAccount = this.generateNewAccountData(
        this.accountInput.value,
        this.passwordInput.value
      );
      chrome.extension.sendMessage({ addAccount: newAccount });

      setTimeout(() => {
        let allAccount = new AllAccount();
        allAccount.updateNewAccountList();
      }, 0.2 * 1000);
    }

    this.accountInput.value = "";
    this.passwordInput.value = "";
    this.accountInput.focus();
  }

  generateNewAccountData(account, password) {
    return {
      account,
      password,
      userId: Date.now(),
      label: false,
    };
  }
}

class AllAccount {
  constructor() {
    this.initList();
    this.displayAllAccount();
  }

  initList() {
    const list = document.querySelector(".account-array");
    this.list = list;
  }

  displayAllAccount() {
    const AllAccount = this;
    chrome.extension.sendMessage({ displayArr: "displayArr" }, function ({
      accountInfo,
      currentAccount,
    }) {
      if (accountInfo) {
        AllAccount.list.innerHTML = "";
        accountInfo.forEach((each) => {
          each = JSON.parse(each);

          AllAccount.addToList(each);
        });


        //如果已经有选中的账号，点亮标记
        if (currentAccount && currentAccount["account"]) {
          let selectedTr = document.getElementById("a" + currentAccount.userId);
          let label = selectedTr.querySelector(".selected");
          label.src = currentAccount.label ? "/icon/g1.png" : "/icon/g2.png";

          //讲选中账号放到当前账号行中
          AllAccount.updateCurrentAccount();
        }
        else{
          let currentLine = document.getElementById("current");
              currentLine.innerHTML = '';

        }
      }
    });
  }


  updateCurrentAccount() {
    new CurrentAccount();
  }

  updateNewAccountList() {
    chrome.extension.sendMessage({ displayAll: "displayArr" });
  }

  addToList(account) {
    //生成列表中的每一个账号
    let eachInList = this.generateEachAccountInList(account);
    this.list.prepend(eachInList);
    //给每个账号绑定选择事件
    this.selectionLabelBinding(eachInList, account);
    this.deleteLabelBinding(eachInList, account);
  }

  generateEachAccountInList(account) {
    let tr = document.createElement("tr");
    tr.innerHTML = `
                  <td><i><img class="icon selected"  alt=""></i></td>
                  <td>${account.account}</td>
                  <td><i><img class="icon delete"  src="/icon/delete.png" alt=""></i></td>`;
    tr.querySelector(".selected").src = account.label
      ? "/icon/g1.png"
      : "/icon/g2.png";
    tr.id = "a" + account.userId;

    return tr;
  }

  selectionLabelBinding(eachAccount, accountObj) {
    const AllAccount = this;
    let currentSelector = eachAccount.querySelector(".selected");
    currentSelector.style = "cursor: pointer";
    currentSelector.addEventListener("click", () => {
      accountObj.label = !accountObj.label;

      chrome.extension.sendMessage({ updateAccount: accountObj });

      setTimeout(() => {
        this.displayAllAccount();
      }, 0.2 * 1000);
    });
  }

  deleteLabelBinding(eachAccount, accountObj) {
    let deleteCurrent = eachAccount.querySelector(".delete");
    deleteCurrent.style = "cursor: pointer";
    deleteCurrent.addEventListener("click", () => {
      chrome.extension.sendMessage({ deleteAccount: accountObj });

      setTimeout(() => {
        this.displayAllAccount();
      }, 0.1 * 1000);
    });
  }
}

class CurrentAccount{
  constructor(){
    this.init();
  }

  init(){
    let currentLine = document.getElementById("current");
    chrome.extension.sendMessage(
      { currentAccount: "currentAccount" },
      function ({ currentAccount }) {
        currentLine.innerHTML = currentAccount? `<h5>${currentAccount["account"]}</h5>`: "";
      }
    );
  }
}






class App {
  constructor() {
    this.init();
  }

  init() {
    this.topButtonInit(); //初始化顶部按钮
    this.inputAreaInit(); //账号密码输入区初始化
    this.currentAccountInit(); //显示当前选中账号
    this.allAccountInit(); //显示保存的全部账号
  }

  topButtonInit() {
    const topBtn = new TopButton();
  }

  inputAreaInit() {
    let inputArea = new InputArea();
  }

  currentAccountInit() {
    const currentAccout = new CurrentAccount();

  }

  allAccountInit() {
    let allAccount = new AllAccount();
  }
}

new App();
