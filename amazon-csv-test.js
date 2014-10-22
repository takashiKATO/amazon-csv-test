//Amazonの注文履歴をCSV形式にして出力するスクリプト
//
//以下のスクリプトを参考に作成されました。
//http://moroya.hatenablog.jp/entry/2013/06/03/225935
//
//CSVに成型しているのは14行目から定義されているformatEntryという関数なので、これを書き換えれば自由な書式で出力できます。
(function(){
 
 // 各注文履歴をCSVフォーマットにして返す
 var datePattern = new RegExp("(\\d{4})年(\\d{1,2})月(\\d{1,2})日");
 function formatEntry(entry) {
  entry.date.match(datePattern);
  var year = RegExp.$1;
  var month = RegExp.$2; if (month.length <= 1) month = "0" + month;
  var day = RegExp.$3; if (day.length <= 1) day = "0" + day;
  var item = entry.item.split(",").join("\\,");
  return year + "/" + month + "/" + day + "," + entry.price + "," + item + "\n";
 }
 
 // 一つの注文に含まれる複数の物品名をつなぐ文字列
 var itemDelimiter = " / ";
 
 var total = {};
 var year = '2014';
 var all = false;
 function init(num) {
  console.log("init="+num)
  if(typeof num !== 'number') {
   num = 0;
   $('<div/>').css({
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,.7)',
    color: '#fff',
    fontSize: 30,
    textAlign: 'center',
    paddingTop: '15em'
   }).attr('id', '___overlay').text('Amazonいくら使った？').appendTo('body');
   year = window.prompt('何年分の注文を集計しますか？\n半角数字4桁で入力してください\n（全期間を集計する場合は「all」と入力）', year);
   if(year === 'all') {
    all = true;
    year = $('#orderFilter option:last').val().match(/[0-9]/g).join('');
   } else if(!/^[0-9]{4}$/.test(year)) {
    alert('正しい数値を入力してください');
    $('#___overlay').remove();
    return false;
   }
   year = Number(year);
  }
  var progress = load(num);
  $('#___overlay').text(year+'年の集計中… / '+(num+1)+'ページ目');
  progress.done(function(results){
   if (typeof total[year] === 'undefined') {
    total[year] = results;
   } else {
    total[year] = total[year].concat(results);
   }
   init(num+1);
  }).fail(function(){
   if(all && new Date().getFullYear() > year) {
    year++;
    init(0);
   } else {
    var txt = 'あなたは\n';
    var _contents = "";
    var _total = 0;
    $.each(total, function(year, results){
     var yen = 0;
     $.each(results, function(){
      yen += this.price;
      _contents += formatEntry(this);
     });
     txt += year + '年 合計' + addFigure(yen) + '円分\n';
     _total += yen;
    });
    if(all) txt += '総計' + addFigure(_total) + '円分\n';
    popup(_contents).alert(txt + 'の買い物をAmazonでしました！');
   $('#___overlay').remove();
   }
  });
 }
 function load(num) {
  console.log("load="+num);
  var df = $.Deferred();
  var page = get(num);
  console.log("could get");
  page.done(function(data){
   var dom = $.parseHTML(data);
   var results = [];
  
   $(dom).find('.action-box').each(function(){
    var box = $(this);
    var dateText = $(box.find('h2')[0]).text();
    var items = [];
    box.find('.item-title').each(function(){
     items.push($(this).text().trim());
     console.log($(this).text());
    });
    var item = items.join(itemDelimiter);
    console.log(item);
  
    var priceText = $(box.find('.price')[0]).text();
    var price = Number(priceText.match(/[0-9]/g).join(''));
  
    console.log(price);
    results.push({'date':dateText,'item':item,'price':price});
   });
  
   if(results.length <= 0) df.reject();
   else df.resolve(results);
  });
  return df.promise();
 }
 function get(num) {
  var df = $.Deferred();
  console.log("starting ajax")
  $.ajax({
   url: 'https://www.amazon.co.jp/gp/css/order-history/?orderFilter=year-'+year+'&startIndex='+num*10,
   success: function(data){
    console.log("ajax success");
    df.resolve(data);
   }
   
  });
  return df.promise();
 }
 function addFigure(str) {
  var num = new String(str).replace(/,/g, "");
  while(num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
  return num;
 }
  
 function popup(content) {
  var generator=window.open('','name','height=250,width=700');
  generator.document.write('<html><head><title>Amazon to CSV</title>');
  generator.document.write('</head><body>');
  generator.document.write('<pre>');
  generator.document.write(content);
  generator.document.write('</pre>');
  generator.document.write('</body></html>');
  generator.document.close();
  return generator;
 }
  
 var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#47;'
 };
 var entityPatern = new RegExp("[&<>\"'\/]", "g");
 function escapeHtml(string) {
  return String(string).replace(entityPattern, function (s) {
   return entityMap[s];
  });
 }
  
 if(typeof $ !== 'function') {
  var d=document;
  var s=d.createElement('script');
  s.src='//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js';
  s.onload=init;
  d.body.appendChild(s);
 } else {
  init();
 }
})();
