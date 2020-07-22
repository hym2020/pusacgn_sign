
var login = require("../core/discuzLogin.js");
var simer = require("./pusacgnSim.js")
var fs = require("fs");
var request = require("request");

function getRealSiteDomain(){
	return new Promise(resolve => {
		var t = request({
			url: process.env.SITEHOST
		}, () => {
			resolve(t.uri.href.replace(/\/?$/, ""));
		});
	});
}

var try_time = 50;
var sleep = sec => new Promise(resolve => setTimeout(resolve, sec*1000));

async function greet(simerObj){
	console.log("開始打招呼...\n\n");
	try{
		let r = await simerObj.doGreet();
		console.log("打招呼結果\n\n");
		console.log(r);
		console.log("\n\n");
	}
	catch(e){
		console.log(e);
		return;
	}
}


async function main(){
	const siteURL = await getRealSiteDomain();
	
	if(try_time == 0) return;
	
	var logger = new login("pusacgn", process.env.USR, process.env.PASS, siteURL, true, false);
	console.log("正在使用腳本登錄...\n\n");
	console.log("確認Cookie....\n\n");
	var isLogin = logger.siteUtils.isLogin();
	if(isLogin){
		let b = await logger.siteUtils.sendGetRequest(siteURL);
		fs.writeFileSync("./mytest.html",b.body);
		console.log("已登錄\n\n");
		await sleep(2);
		
		console.log("正在簽到...");
		
		let pusSim = new simer(siteURL);
		b = await pusSim.dailySign();
		console.log(b);
		
	
		if(b.status != "success") {
			await sleep(5);
			try_time--;
			return main();
		}
		
		b = await pusSim.signPostProcess();
		console.log(b);
		await greet(pusSim);
		return;
	}
	console.log("未找到cookie，沒有登錄\n\n");
	console.log("正在嘗試登錄...\n\n");
	
	console.log("正在抓取登錄頁面...\n\n");
	var myjob = await logger.getLoginPage({isHandler: false});
	if(myjob.status == "success")
		console.log("抓取頁面成功!!\n\n");
	else{
		console.log("抓取頁面失敗!!\n\n");
		return;
	}
	console.log("正在送出資料...\n\n");
	myjob = await logger.doPost({
		postHandler: function(b){
			if(!logger.siteUtils.isLogin()){				
				return {
					status: "failed",
					message: "登陸失敗"
				};
			}
			else{
				return {
					status: "success",
					message: "登陸成功"
				};
			}		
	}});
	
	if(myjob.status == "success"){
		console.log(myjob.message + "!!\n\n");
		console.log("正在簽到...");
		
		await sleep(2);
		
		let pusSim = new simer(siteURL);
		let ds = await pusSim.dailySign();
		console.log(ds);
		if(ds.status != "success") {
			await sleep(5);
			try_time--;
			return main();
		}
		
		b = await pusSim.signPostProcess();
		console.log(b);
		await greet(pusSim);
		return;
	}
	else{
		console.log(myjob.message + "!!\n\n");
		return;
	}
};

main();