$(document).ready(function(){
  
  $('#results').hide();
  //Safari appears to have 9 objects in local storage by default, hence the odd if statement
  if(window.localStorage.length === 0){
   $("#saved-co").hide();
  } else {
    $("#saved-co").append("<h3>Favorite Companies</h3><ul></ul>");
    for(var s in window.localStorage){
      if(lsGetMe(s).empNo >= 0){
        $('#saved-co ul').append('<li><a class="old-co">'+ s +'</a></li>');
      }
    }
  }

  function lsGetMe(obj1){
    return JSON.parse(window.localStorage.getItem(obj1));
  }

  $('#saved-co ul').on('click','.old-co',function(e){
    $('#saved-co').fadeOut(1);
    displayDetails(lsGetMe($(this).text()));
    //$('.co-focus').append('<br><a id="saveCo" class="btn btn-primary">Update</a>');
  });

  var CompanyObj = function(name){
    this.coName = name;
    this.coAlias ='';
    this.coDescr = '';
    this.coFoundedOn = '';
    this.coLogoUrl = '';
    this.empNo = '';
    this.coHQCity = '';
    this.forProfit = '';
    this.focusAreas = [];
    this.coWebsite = '';
    this.coCBSite = '';
    this.competitors = [];
    this.coNews = {headline:[], url:[], author:[], postDate:[]};
  };
  $('#see-saved').on('click',function(){
    location.reload();
  });

  function displayDetails(myObj){
    
    //general description div   
    $('#companyCB').append('<h3>' + myObj.coName +'<small> ' + myObj.coAlias + '</small></h3><h5>Founded on: <small>'+myObj.coFoundedOn+'</small></h5>');
    $('#companyCB').append('<p>' + myObj.coDescr + '</p><br>');
    $('#companyCB').append('<hr><h5>Number of Employees: <small> '+myObj.empNo+'</small></h5><h5>For Profit? <small>'+myObj.forProfit+'</small></h5>');


    //category div
    $(".co-focus ul").before("<h3 class='focus-header'>Areas of Focus</h3>");
    for(var i = 0; i < myObj.focusAreas.length; i++){
      $(".co-focus ul").append('<li>' + myObj.focusAreas[i] +'</li>');
    }
    $('.co-focus').append('<a target="_blank" href="'+myObj.coWebsite+'">' + myObj.coName + ' website</a><br>');
    $('.co-focus').append('<a target="_blank" href="'+myObj.coCBSite+'">Crunchbase website</a><br>');

    //news div
    $(".co-news ul").before("<h3>News: "+ myObj.coName +"</h3>");
    for(var n =0; n < myObj.coNews.headline.length; n++){
      $(".co-news ul").append('<li><a target="_blank" href="'+myObj.coNews.url+'">' + myObj.coNews.headline[n] + ' </a>by '+myObj.coNews.author[n]+' '+myObj.coNews.postDate[n]+'</li>');
    }
  }

  var cbKey = process.env.CBKEY;
  
  $("#search-form").on("submit", function(e){
    var company = $("#search-term").val();
    $('#saved-co').hide(); //hide saved companies
    $("#search-term").val("");
    $('h3,h5,p,.show li,hr,#saveCo,.co-focus a').remove(); //need to remove old search

    $.ajax({
      dataType: "jsonp",
      url: "https://api.crunchbase.com/v/2/organizations?&user_key="+cbKey+"&name=" + company,
      success: function(info){
          var items =info.data.items;
          var collection = [];

          $("#results li").remove();
          for(var i=0; i < items.length; i++){
            collection.push(items[i].name);
          }
          collection.forEach(function(n,i){
            if(i < 20){
              $("#results ul").append('<li><a>' + n + '</a></li>');
            }
          });
          $('#results').fadeIn(500);
          $('#results #full').on("click", function(e){
            $('#results').hide();
            $('#results li').remove();
            collection.forEach(function(n){
              $("#results ul").append("<li><a>" + n + "</a></li>");
            });
            $('#results').fadeIn(100);
            $('#results #full').fadeOut(0);
          }); 
        }
    });

    //chrome was unable to process the data due to cross domain call so I had to use JSONP
    // $.getJSON("https://api.crunchbase.com/v/2/organizations?&user_key="+cbKey+"&name=" + company,
    //  function(info){
    //    var items =info.data.items;
    //    var collection = [];

    //    $("#results li").remove();
    //    for(var i=0; i < items.length; i++){
    //      collection.push(items[i].name);
    //    }
    //    collection.forEach(function(n,i){
    //      if(i < 20){
    //        $("#results ul").append('<li><a>' + n + '</a></li>');
    //      }
    //    });
    //    $('#results').fadeIn(500);
    //    $('#results #full').on("click", function(e){
    //      $('#results').hide();
    //      $('#results li').remove();
    //      collection.forEach(function(n){
    //        $("#results ul").append("<li><a>" + n + "</a></li>");
    //      });
    //      $('#results').fadeIn(100);
    //      $('#results #full').fadeOut(0);
    //    }); 
    //  }); 
  });

  $("#results ul").on("click", "li", function(e){
    var selCompany = $(this).text();

    $("#results").fadeOut(200);
    
      
      $.ajax({
        dataType: "jsonp",
        url: "https://api.crunchbase.com/v/2/organization/" +selCompany +"?&user_key="+cbKey,
        success: function(detail){
          if(!(detail.data.properties && detail.data.relationships.categories && detail.data.relationships.news)){
              $('#results').fadeIn(100); 
              var errmsg = 'No information on "'+ selCompany +'" at the moment. \n\n Choose another list item or visit their <a target="_blank" href="https://www.crunchbase.com/organization/' + selCompany + '">Crunchbase website</a>';
              return $('#results ul').before('<p>'+errmsg+'</p>');
          }
          var props = detail.data.properties;
          var cats = detail.data.relationships.categories.items;
          var news = detail.data.relationships.news.items;

          //converting to my object
          var currentCo = new CompanyObj(props.name);
          currentCo.coAlias =  props.also_known_as || "";
          currentCo.coDescr = props.description;
          currentCo.coFoundedOn = props.founded_on;
          currentCo.empNo = props.number_of_employees;
          currentCo.coHQCity = detail.data.relationships.headquarters.items[0].city + detail.data.relationships.headquarters.items[0].region;
          currentCo.forProfit = props.secondary_role_for_profit;
          currentCo.focusAreas = cats.map(function(val){return val.name;});
          currentCo.coWebsite = props.homepage_url;
          currentCo.coCBSite = 'https://www.crunchbase.com/organization/' + currentCo.coName;
          currentCo.coLogoUrl = currentCo.coCBSite +detail.data.relationships.primary_image.items[0].path;
          currentCo.coNews.headline = news.map(function(val){return val.title;});
          currentCo.coNews.url = news.map(function(val){return val.url;});
          currentCo.coNews.author = news.map(function(val){return val.author;});
          currentCo.coNews.postDate = news.map(function(val){return val.posted_on;});
          
          displayDetails(currentCo);

          $('.co-focus').append('<br><a id="saveCo" class="btn btn-primary">Save Company</a>');
            $('#saveCo').on('click',function(){
              if(lsGetMe(currentCo.coName)||false){
                $('#saveCo').attr('class', 'btn btn-warning');
                if(confirm("Update this Company's data?")){
                  window.localStorage.setItem(currentCo.coName, JSON.stringify(currentCo));
                  $('#saveCo').attr('class', 'btn btn-success');
                  $('#saveCo').text('Saved');
                }
              } else{
                window.localStorage.setItem(currentCo.coName, JSON.stringify(currentCo));
                $('#saveCo').attr('class', 'btn btn-success');
                $('#saveCo').text('Saved');
              }
            });
          }
      });

      //chrome was unable to process the data due to cross domain call so I had to use JSONP
      
      // $.getJSON("https://api.crunchbase.com/v/2/organization/" +selCompany +"?&user_key="+cbKey,
      //  function(detail){
      //    if(!(detail.data.properties && detail.data.relationships.categories && detail.data.relationships.news)){
      //      $('#results').fadeIn(100); 
      //      var errmsg = 'No information on "'+ selCompany +'" at the moment. \n\n Choose another list item or visit their <a target="_blank" href="https://www.crunchbase.com/organization/' + selCompany + '">Crunchbase website</a>';
      //      return $('#results ul').before('<p>'+errmsg+'</p>');
      //  }
      //    var props = detail.data.properties;
      //    var cats = detail.data.relationships.categories.items;
      //    var news = detail.data.relationships.news.items;

      //    //converting to my object
      //    var currentCo = new CompanyObj(props.name);
      //    currentCo.coAlias =  props.also_known_as || "";
      //    currentCo.coDescr = props.description;
      //    currentCo.coFoundedOn = props.founded_on;
      //    currentCo.empNo = props.number_of_employees;
      //    currentCo.coHQCity = detail.data.relationships.headquarters.items[0].city + detail.data.relationships.headquarters.items[0].region;
      //    currentCo.forProfit = props.secondary_role_for_profit;
      //    currentCo.focusAreas = cats.map(function(val){return val.name;});
      //    currentCo.coWebsite = props.homepage_url;
      //    currentCo.coCBSite = 'https://www.crunchbase.com/organization/' + currentCo.coName;
      //    currentCo.coLogoUrl = currentCo.coCBSite +detail.data.relationships.primary_image.items[0].path;
      //    currentCo.coNews.headline = news.map(function(val){return val.title;});
      //    currentCo.coNews.url = news.map(function(val){return val.url;});
      //    currentCo.coNews.author = news.map(function(val){return val.author;});
      //    currentCo.coNews.postDate = news.map(function(val){return val.posted_on;});
          
      //    displayDetails(currentCo);

      //    $('.co-focus').append('<br><a id="saveCo" class="btn btn-primary">Save Company</a>');
      //    $('#saveCo').on('click',function(){
      //      if(lsGetMe(currentCo.coName)||false){
      //        $('#saveCo').attr('class', 'btn btn-warning');
      //        if(confirm("Update this Company's data?")){
      //          window.localStorage.setItem(currentCo.coName, JSON.stringify(currentCo));
      //          $('#saveCo').attr('class', 'btn btn-success');
      //          $('#saveCo').text('Saved');
      //        }
      //      } else{
      //        window.localStorage.setItem(currentCo.coName, JSON.stringify(currentCo));
      //        $('#saveCo').attr('class', 'btn btn-success');
      //        $('#saveCo').text('Saved');
      //      }
      //    });
      // });
    });
});
  