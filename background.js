/*********************************************************************/

class Database {
  constructor() {
    this.listen();
  }

  listen() {
    const DATABASE = this;

    //开始监听指令
    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      const KEEP_CHANNEL_OPEN = true;

      //监听到指令立即放入函数中执行
      databaseOperator(request)();

      function databaseOperator(request) {
        //取出指令
        if (Object.keys(request).length !== 1) {
          return;
        }
        let ins = Object.keys(request)[0];


        //定义一个指令集，接收不同指令返回不同function
        const instructionArr = {
          // 每次打开popup，取出数据显示全部账号
          displayArr: function () {
            DATABASE.getStorage(
              ["accountInfo", "currentAccount"],
              sendResponse
            );
          },
          // 每次打开popup，取出数据显示当前选中账号
          currentAccount: function () {
            DATABASE.getStorage(["currentAccount"], sendResponse);
          },
          updateAccount: function () {
            DATABASE.updateAccount(request.updateAccount);
          },
          addAccount: function () {
            DATABASE.setStorage(request.addAccount);
          },
          deleteAccount: function () {
            DATABASE.deleteStorage(request.deleteAccount);
          },
          labelRecord: function () {
            DATABASE.getLabelRecord(request.labelRecord);
          },
        };

        return (
          instructionArr[ins] || (() => console.log("Instruction not found."))
        );
      }

      return KEEP_CHANNEL_OPEN;
    });
  }

  updateAccount(updateAccount) {
    chrome.storage.local.get(["accountInfo"], ({ accountInfo: storager }) => {
      console.log(storager);
      let newAccountList = storager.map((each) => {
        each = JSON.parse(each);
        if (each.userId === updateAccount.userId) {
          each = updateAccount;
        } else {
          each.label = false;
        }
        return JSON.stringify(each);
      });

      chrome.storage.local.set({ accountInfo: newAccountList });

      let noCurrentAccount = {account:'',password:'',userId:0,label:false};
      chrome.storage.local.set({
        currentAccount: updateAccount.label ? updateAccount : noCurrentAccount
      });
    });
  }

  getStorage(key, callback) {


    chrome.storage.local.get(key, function (result) {

      callback(result);
    });
  }

  setStorage(value) {
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

      if (
        storager["currentAccount"] &&
        dele.userId === storager["currentAccount"].userId
      ) {
        chrome.storage.local.set({
          currentAccount: {
            account: "",
            password: "",
            userId: 0,
            label: false,
          },
        });
      }
    });
  }

  //获取账号是否选中的标记信息
  getLabelRecord(account) {
    chrome.storage.local.get(["currentAccount"], (current) => {
      if (current.userId !== account.userId) {
        chrome.storage.local.set({ currentAccount: account });
      } else {
        chrome.storage.local.set({
          currentAccount: {
            account: "",
            password: "",
            userId: 0,
            label: false,
          },
        });
      }
    });
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

  //红蓝小图标转换
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
