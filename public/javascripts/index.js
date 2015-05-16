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
  });

  // var CompanyObj = function(name){
  //   this.coName = name;
  //   this.coAlias ='';
  //   this.coDescr = '';
  //   this.coFoundedOn = '';
  //   this.coLogoUrl = '';
  //   this.empNo = '';
  //   this.coHQCity = '';
  //   this.forProfit = '';
  //   this.focusAreas = [];
  //   this.coWebsite = '';
  //   this.coCBSite = '';
  //   this.competitors = [];
  //   this.coNews = {headline:[], url:[], author:[], postDate:[]};
  // };
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

  $("#search-form").on("submit", function(e){
    var company = $("#search-term").val();
    $('#saved-co').hide(); //hide saved companies
    $("#search-term").val("");
    $('h3,h5,p,.show li,hr,#saveCo,.co-focus a').remove(); //need to remove old search

    $.ajax({
      dataType: "json",
      type: 'GET',
      url: window.location.href + "search/" + company,
      success: function(info){
        console.log(info.list);
          
          var collection = info.list;

          $("#results li").remove();
          collection.forEach(function(n,i){
            if(i < 20){
              $("#results ul").append('<li><a>' + n + '</a></li>');
            }
          });

          $('#results').fadeIn(0);
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
  });

  $("#results ul").on("click", "li", function(e){
    var selCompany = $(this).text();

    $("#results").fadeOut(200);
    console.log(window.location.href + "show/"+ selCompany);
      
      $.ajax({
        dataType: "json",
        url: window.location.href + "show/"+ selCompany,
        success: function(currentCo){
          // console.log(currentCo);
          if(currentCo === "1" || !currentCo.coName){
              $('#results').fadeIn(100); 
              var errmsg = 'No information on "'+ selCompany +'" at the moment. \n\n Choose another list item or visit their <a target="_blank" href="https://www.crunchbase.com/organization/' + selCompany + '">Crunchbase website</a>';
              $('#results ul').before('<p>'+errmsg+'</p>');
              return;
          }
            //object from backend    
            // var currentCo = detail;
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

    });
});
  