// const autoLoginBtn = document.getElementById("allowAutoLogin"); //popup上的自动登录打开按钮
// const list = document.querySelector(".account-arryy"); //popup上的用户列表
// const account = document.getElementById("account"); //输入的用户名
// const password = document.getElementById("password"); //输入的密码
// const add = document.getElementById("add"); //添加用户按钮
// const currentLine = document.getElementById("current"); //pop上的当前账号栏
// autoLoginBtn.disabled = true; //自动登录按钮初始为关闭状态

//判定当前页面是否为163 email，自动登陆按钮是否可以点击
// let currentTab;
// chrome.tabs.query({
//     active: true,
//     currentWindow: true
// }, function (tabs) {
//     if (/:\/\/mail.163.com\/*/g.test(tabs[0].favIconUrl)) {
//         autoLoginBtn.disabled = false;
//         currentTab = tabs[0];
//     }
// });

//每一次popup打开，判定当前按钮是开是关
// chrome.storage.local.get(["open"], function (result) {
//   autoLoginBtn.checked = result.open === undefined ? false : result.open;
// });

// 自动登录按钮点击事件，显示一键登录按钮在163页面上

// autoLoginBtn.addEventListener("click", function () {
//   if (currentTab) {
//     chrome.storage.local.set({ open: autoLoginBtn.checked });
//     let displayBtn = { enableLogin: autoLoginBtn.checked };
//     chrome.tabs.sendMessage(
//       currentTab.id,
//       JSON.stringify(displayBtn),
//       (response) => {}
//     );
//   }
// });

//popup打开时,读取当前账户并显示在popup上
// chrome.extension.sendMessage({ getCurrentAccount: "get" }, function ({
//   currentAccount,
// }) {
//   if (currentAccount && currentAccount.userId) {
//     currentLine.innerHTML = `<h5>${currentAccount.account}</h5>`;
//   } else {
//     currentLine.innerHTML = "";
//   }
// });

//读取已记录的账号并显示在popup上

// chrome.extension.sendMessage({ displayArr: "displayArr" }, function ({
//   accountInfo,
//   currentAccount,
// }) {
//   if (accountInfo) {
//     console.log(accountInfo);
//     list.innerHTML = "";
//     accountInfo.forEach((each) => {
//       console.log(each);
//       each = JSON.parse(each);
//       console.log(each);
//       addToList(each);
//     });
//   }
//   if (currentAccount && currentAccount.account) {
//     let selectedTr = document.getElementById("a" + currentAccount.userId);
//     let label = selectedTr.querySelector(".selected");

//     label.src = currentAccount.label ? "/icon/g1.png" : "/icon/g2.png";
//   }
// });

//添加账号按钮绑定动作
//绑定回车
// document.addEventListener("keyup", function (e) {
//   e.key === "Enter" && accountAdding();
// });
// //绑定点击
// add.addEventListener("click", accountAdding);

// function accountAdding() {
//   if (account.value && password.value) {
//     let thisAccount = {
//       account: account.value,
//       password: password.value,
//       userId: Date.now(),
//       label: false,
//     };

//     chrome.extension.sendMessage({ addAccount: thisAccount }, function (
//       response
//     ) {
//       console.log("this is the :", response);
//     });

//     //发送账号信息到background后，拉取更新后的用户数组，更新列表
//     setTimeout(function () {
//       chrome.extension.sendMessage({ displayAll: "displayArr" }, function ({
//         accountInfo,
//       }) {
//         accountInfo = JSON.parse(accountInfo);
//         list.innerHTML = "";
//         accountInfo.forEach((eachAccount) => {
//           addToList(eachAccount);
//         });
//       });
//     }, 100);
//   }
//   account.value = "";
//   password.value = "";
//   account.focus();
// }


let currentLine = document.getElementById("current");

//将当前账号信息放入list里，在popup上显示出来
function addToList(thisAccount) {
  const list = document.querySelector(".account-array");


  let tr = document.createElement("tr");
  tr.innerHTML = `
                <td><i><img class="icon selected"  alt=""></i></td>
                <td>${thisAccount.account}</td>
                <td><i><img class="icon delete"  src="/icon/delete.png" alt=""></i></td>`;

  tr.querySelector(".selected").src = thisAccount.label
    ? "/icon/g1.png"
    : "/icon/g2.png";
  tr.id = "a" + thisAccount.userId;
  list.prepend(tr);

  //增加选中动作
  let currentSelector = tr.querySelector(`.selected`);
  currentSelector.style = "cursor: pointer";
  currentSelector.addEventListener("click", () => {
    //更改账号点击状态并发送给后台用于更新
    thisAccount.label = !thisAccount.label;
    chrome.extension.sendMessage({ updateAccount: thisAccount }, function (
      response
    ) {
      console.log(response);
    });
    //将popup上被点击的label按钮以外的其他label标记全部置灰
    let allSelector = document.getElementsByClassName("selected");
    for (let i = 0; i < allSelector.length; i++) {
      if (
        allSelector[i].closest("tr").id !== currentSelector.closest("tr").id
      ) {
        allSelector[i].src = "/icon/g2.png";
      }
    }
    //将当前点击的label置亮
    currentSelector.src = /icon\/g2\.png/g.test(currentSelector.src)
      ? label_light(thisAccount)
      : label_Dark();
  });

  //增加删除动作
  let deleteCurrent = tr.querySelector(".delete");
  deleteCurrent.addEventListener("click", () => {
    //发送要删除的账号信息到background，更新数据库
    chrome.extension.sendMessage({ deleteAccount: thisAccount }, function (
      response
    ) {
      console.log("deleted account:", response);
    });

    //如果删除的是当前账号，将popup当前账号栏清空
    if (/icon\/g1/g.test(tr.querySelector(".selected").src)) {
      currentLine.innerHTML = `<td></td>`;
    }

    let index = [].indexOf.call(list.childNodes, tr);
    list.removeChild(list.children[index]);
  });
  deleteCurrent.style = "cursor: pointer";
}

//取消选中，发送取消信息到background
function label_Dark() {
  currentLine.innerHTML = `<td></td>`;
  chrome.extension.sendMessage({ labelRecord: { account: "", label: false } });
  return "/icon/g2.png";
}

//选中，发送选中信息到background
function label_light(thisAccount) {
  currentLine.innerHTML = `<h4>${thisAccount.account}</h4>`;
  chrome.extension.sendMessage({ labelRecord: thisAccount });

  return "/icon/g1.png";
}

/************************************************************** */

class StorageHelper {
  getStorage(key, callback) {
    chrome.storage.local.get(key, callback);
  }
}

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
          // this.currentTab = tabs[0];
        }
      }
    );
  }

  checkBtnOnOff() {
    let storager = new StorageHelper();
    storager.getStorage(["open"], (result) => {
      console.log(result);
      this.autoLoginBtn.checked =
        result["open"] === undefined ? false : result["open"];
    });
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

    this.addBtn.addEventListener("click", ()=>this.accountAdding());
  }



  accountAdding() {

    if (account.value && password.value) {
      //根据输入的信息生成用户数据，发送到background 数据库
      let newAccount = this.generateNewAccountData(account, password);
      chrome.extension.sendMessage({addAccount: newAccount});

      let allAccount = new AllAccount();
      allAccount.updateNewAccountList();
    }
  }

  generateNewAccountData(account, password) {
    return {
      account: account.value,
      password: password.value,
      userId: Date.now(),
      label: false
    };
  }


}




class AllAccount {
  constructor() {
    this.initList();

    this.displayAllAccount();
  }

  initList(){
    const list = document.querySelector(".account-array");
    this.list = list;

  }

  displayAllAccount() {
    const list = this.list;

    chrome.extension.sendMessage({ displayArr: "displayArr" }, function ({
      accountInfo,
      currentAccount,
    }) {


      if (accountInfo) {
        list.innerHTML = "";
        accountInfo.forEach((each) => {
          each = JSON.parse(each);
          addToList(each);
        });

        //如果已经有选中的账号，点亮标记
        if (currentAccount && currentAccount["account"]) {
          let selectedTr = document.getElementById("a" + currentAccount.userId);
          let label = selectedTr.querySelector(".selected");

          label.src = currentAccount.label ? "/icon/g1.png" : "/icon/g2.png";
        }
      }
    });
  }

  updateNewAccountList(){

    const list = this.list;
    console.log("sent");
    chrome.extension.sendMessage({displayAll:"displayArr"},function({accountInfo}){
      console.log(accountInfo);
    });

  //   setTimeout(function () {
  //           chrome.extension.sendMessage({ displayAll: "displayArr" }, function ({
  //             accountInfo,
  //           }) {
  //             accountInfo = JSON.parse(accountInfo);
  //             list.innerHTML = "";
  //             console.log("now");
  //             accountInfo.forEach((eachAccount) => {
  //               addToList(eachAccount);
  //             });
  //           });
  //         }, 0.1*1000);
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
    let currentLine = document.getElementById("current");
    chrome.extension.sendMessage(
      { currentAccount: "currentAccount" },
      function ({ currentAccount }) {
        if (currentAccount)
          currentLine.innerHTML = `<h5>${currentAccount["account"]}</h5>`;
        else currentLine.innerHTML = "";
      }
    );
  }

  allAccountInit() {
    let allAccount = new AllAccount();
  }
}

new App();
