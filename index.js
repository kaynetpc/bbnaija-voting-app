const contractSource = `
contract NaijaVote =

  record naija =
    { creatorAddress : address,
      url            : string,
      name           : string,
      voteCount      : int }

  record state =
    { naijas      : map(int, naija),
      naijasLength : int }

  entrypoint init() =
    { naijas = {},
      naijasLength = 0 }

  entrypoint getNaija(index : int) : naija =
  	switch(Map.lookup(index, state.naijas))
	    None    => abort("There was no naija with this index registered.")
	    Some(x) => x

  stateful entrypoint registerNaija(url' : string, name' : string) =
    let naija = { creatorAddress = Call.caller, url = url', name = name', voteCount = 0}
    let index = getNaijasLength() + 1
    put(state{ naijas[index] = naija, naijasLength = index })

  entrypoint getNaijasLength() : int =
    state.naijasLength

  stateful entrypoint voteNaija(index : int) =
    let naija = getNaija(index)
    Chain.spend(naija.creatorAddress, Call.value)
    let updatedVoteCount = naija.voteCount + Call.value
    let updateNaijas = state.naijas{ [index].voteCount = updatedVoteCount }
    put(state{ naijas = updateNaijas })`;

const contractAddress = 'ct_2GnCun2wUc6xuDJ9Ma95fgyVjA1F6CVRE7HpG16LANfCQFwMvu'     
//Create variable for client so it can be used in different functions
var client = null;
var naijaArray = [];
var naijasLength = 0;

function renderNaijas() {
  naijaArray = naijaArray.sort(function(a,b){return b.votes-a.votes})
  let template = $('#template').html();
  Mustache.parse(template);
  let rendered = Mustache.render(template, {naijaArray});
  $('#naijaBody').html(rendered);
}



async function callStatic(func, args) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e) => console.error(e);
  const decodedGet = await calledGet.decode().catch(e) => console.error(e);

  return decodedGet;
}


async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledSet = await contract.call(func, args, {amount: value}).catch(e) => console.error(e);

  return calledSet;
}



window.addEventListener('load', async () => {

  $("#loader").show();


  client = await Ae.Aepp();


  naijasLength = await callStatic('getNaijasLength', []);


  for (let i = 1; i <= naijasLength; i++) {


    const naija = await callStatic('getNaija', [i]);

 
    naijaArray.push({
      creatorName: naija.name,
      naijaUrl: naija.url,
      index: i,
      votes: naija.voteCount,
    })
  }

 

  renderNaijas();


  $("#loader").hide();
});


jQuery("#naijaBody").on("click", ".voteBtn", async function(event){
  $("#loader").show();

  let value = $(this).siblings('input').val(),
      index = event.target.id;


  await contractCall('voteNaija', [index], value);


  const foundIndex = naijaArray.findIndex(naija => naija.index == event.target.id);


  naijaArray[foundIndex].votes += parseInt(value, 10);

  renderNaijas();
  $("#loader").hide();
});

$('#registerBtn').click(async function(){
  $("#loader").show();
  const name = ($('#regName').val()),
        url = ($('#regUrl').val());

  await contractCall('registerNaija', [url, name], 0);


  naijaArray.push({
    creatorName: name,
    naijaUrl: url,
    index: naijaArray.length+1,
    votes: 0,
  })

  renderNaijas();
  $("#loader").hide();
});







$('#help-btn').click(function(){

  $('#help-btn').hide();
  $('#help-btn-close').show();
  $('#help-btn-cont').show();
});

$('#help-btn-close').click(function(){

  $('#help-btn').show();
  $('#help-btn-close').hide();
  $('#help-btn-cont').hide();
});
