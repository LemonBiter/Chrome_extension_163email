// //监听当前页面，小图标红蓝切换
// chrome.tabs.onActivated.addListener(() => {
//     chrome.tabs.query({
//         active: true,
//         currentWindow: true
//     }, function (tabs) {
//         if (/:\/\/mail.163.com\/*/g.test(tabs[0].favIconUrl)) {
//             chrome.browserAction.setIcon({
//                 path: "popup/blue_38.png"
//             })
//         } else {
//             chrome.browserAction.setIcon({
//                 path: "popup/red_38.png"
//             })
//         }
//     });
// })

chrome.runtime.onMessage.addListener(function (request, sender, sendRequest) {
  const KEEP_CHANNEL_OPEN = true;

  console.log(request);

  // if (request === "selectedAccount") {
  //   chrome.storage.local.get(["currentAccount"], function (result) {
  //     let currentAccountString = JSON.stringify(result);
  //     sendRequest(currentAccountString);
  //   });
  // }

  //向数据库增加用户
  // if (request.addAccount) {
  //   add(request);
  // }
  //从数据库删减用户
  // if (request.deleteAccount) {
  //   remove(request);
  // }
  //更新账户的选中或未选中信息
  if (request.updateAccount) {
    update(request);
  }

  // if (request.currentAccount) {
  //   let thisAccount = request.currentAccount;
  //   if (thisAccount.label) {
  //     chrome.storage.local.set({ currentAccount: thisAccount }, function () {});
  //   } else {
  //     chrome.storage.local.set({ currentAccount: thisAccount }, function () {});
  //   }
  // }



  else if (request.getCurrentAccount) {
    chrome.storage.local.get(["currentAccount"], function (result) {
      sendRequest(result);
    });
  }

  //点击一键登录，从此处获取当前账号数据
  else if (request.getData) {
    chrome.storage.local.get(["currentAccount", "accountInfo"], function (
      result
    ) {
      let all = result.accountInfo;
      let one = result.currentAccount;
      if (all && one) {
        let selected = all.filter((each) => each.userId === one.userId);
        sendRequest(selected[0]);
      }
    });

    //账号选中状态
  }

  return KEEP_CHANNEL_OPEN;
});

//往用户数组增加新的账号信息
// function add({ addAccount }) {
//   addAccount = JSON.parse(addAccount);
//   chrome.storage.local.get(["accountInfo"], (arr) => {

//     let accountArray = arr["accountInfo"] ? arr["accountInfo"] : [];
//     accountArray.push(addAccount);

//     chrome.storage.local.set({ accountInfo: accountArray }, function () {});
//   });
// }

//从账户数组移除用户

// function remove({ deleteAccount }) {
//   chrome.storage.local.get(["accountInfo", "currentAccount"], (arr) => {
//     let accountArray = arr["accountInfo"];
//     let newAccountArray = accountArray.filter(
//       (each) => each.userId !== deleteAccount.userId
//     );
//     chrome.storage.local.set({ accountInfo: newAccountArray }, function () {});
//     if (arr["currentAccount"].userId === deleteAccount.userId) {
//       chrome.storage.local.set({
//         currentAccount: { account: "", password: "", userId: 0, label: "" },
//       });
//     }
//   });
// }

//储存账户的选中与取消选中标记
function update({ updateAccount }) {
  chrome.storage.local.get(["accountInfo"], (arr) => {
    let accountArray = arr["accountInfo"];
    accountArray.forEach((each, index) => {
      if (each.userId === updateAccount.userId) {
        accountArray[index] = updateAccount;
      } else {
        each.label = false;
      }
    });
    chrome.storage.local.set({ accountInfo: accountArray }, function () {});
  });
}

/******************************************************************** */

class Database {
  constructor() {
    this.listen();
  }

  listen() {
    const DATABASE = this;

    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      const KEEP_CHANNEL_OPEN = true;

      //监听到指令就立即执行
      databaseOperator(request)();

      function databaseOperator(request) {

        if (Object.keys(request).length !== 1) {
          return;
        }

        let ins = Object.keys(request)[0];

        //定义一个指令集，接收不同指令返回不同function
        const instructionArr = {
          // 每次打开popup，取出数据显示全部账号
          displayArr: function () {
            DATABASE.getStorage(["accountInfo", "currentAccount"],sendResponse);
          },
          // 每次打开popup，取出数据显示当前选中账号
          selectedAccount: function () {
            DATABASE.getStorage(
              ["accountInfo", "currentAccount"],
              sendResponse
            );
          },
          addAccount: function () {
            DATABASE.setStorage(request.addAccount);
          },
          deleteAccount: function () {
            DATABASE.deleteStorage(request.deleteAccount);
          },
          labelRecord: function(){
            DATABASE.getLabelRecord(request.labelRecord);
          }
        };

        return (
          instructionArr[ins] || (() => console.log("Instruction not found."))
        );
      }

      return KEEP_CHANNEL_OPEN;
    });
  }

  getStorage(key, callback) {
    chrome.storage.local.get(key, function (result) {
      callback(result);
    });
  }

  setStorage(value) {
    console.log(value);
    chrome.storage.local.get(["accountInfo"], (storager) => {
      //确认是否有用户数组存在，不存在就创建一个
      let accountInfo = storager["accountInfo"] ? storager["accountInfo"] : [];

      accountInfo.push(JSON.stringify(value));

      chrome.storage.local.set({ accountInfo });
    });
  }

  deleteStorage(dele) {
    chrome.storage.local.get(["accountInfo", "currentAccount"], (storager) => {
      let accountArray = storager["accountInfo"];
      let newAccountArray = accountArray.filter((each) => {
        return JSON.parse(each).userId !== dele.userId;
      });
      newAccountArray.map((each) => JSON.stringify(each));
      chrome.storage.local.set({ accountInfo: newAccountArray });

      if (dele.userId === storager["currentAccount"].userId) {
        chrome.storage.local.set({ currentAccount: "none" });
      }
    });
  }

  //获取账号是否选中的标记信息
  getLabelRecord(account){

    chrome.storage.local.get(["currentAccount"],current =>{
      if(current.userId!== account.userId){
        chrome.storage.local.set({currentAccount:account});
      }
      else{
        chrome.storage.local.set({currentAccount:{account:'',password:'',userId:0,label:false}})
      }
    })

  }
}

class Background {
  constructor() {
    this.handleDatabase();
    this.blueRedIcon();
  }

  handleDatabase() {
    //数据库开始监听
    let database = new Database();
    this.database = database;
  }

  blueRedIcon() {
    //监听当前页面，小图标红蓝切换
    chrome.tabs.onActivated.addListener(() => {
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        function (tabs) {
          if (/:\/\/mail.163.com\/*/g.test(tabs[0].favIconUrl)) {
            chrome.browserAction.setIcon({
              path: "popup/blue_38.png",
            });
          } else {
            chrome.browserAction.setIcon({
              path: "popup/red_38.png",
            });
          }
        }
      );
    });
  }
}

new Background();
