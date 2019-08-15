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
    put(state{ naijas = updateNaijas })

`;
const contractAddress ='ct_2bWK9GrFQYGjFNKzrAny9NwtTv4t54zMnUY5cruDU9gpDYruKm';

var naijaArray =[];
/*
var naijaArray = [
    {"creatorName": "Avala","naijaUrl": "https://ocdn.eu/pulscms-transforms/1/9SBk9kpTURBXy8yODk5ODliNTg1ZGYxMzRkY2Q4MjM2ZTczZGE0ODU0Zi5qcGeSlQMAAM0FAM0C0JMFzQMUzQG8gaEwBQ","votes":18, "index":1, "rank":1},
    {"creatorName": "Ike","naijaUrl": "https://guardian.ng/wp-content/uploads/2019/07/BBNaija-Ike-Photo-BigBrotherNaijaShow.jpg","votes":27, "index":2, "rank":2},
    {"creatorName": "Mercy","naijaUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0iTbnECvbSMiNnDYY_7IGJ7PctQuuBp2sI5FnSRIcx_NRMIBg","votes":14, "index":3, "rank":3},
    {"creatorName": "Tasha","naijaUrl": "https://pbs.twimg.com/media/EBpVAOKXoAUM-7o?format=jpg&name=small","votes":12, "index":4, "rank":4},
    {"creatorName": "Seyi","naijaUrl": "https://pbs.twimg.com/media/EBpVANxX4AU1KCP?format=jpg&name=360x360","votes":24, "index":5, "rank":5}
  ];
*/
  var naijaLength = 0;


function renderNaijas() {
  naijaArray = naijaArray.sort(function(a,b){return b.votes-a.votes})
  var template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {naijaArray});
  $('#naijaBody').html(rendered);
}

window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();

  const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledGet = await contract.call('getNaijasLength', [], {callStatic: true}).catch(e => console.error(e));
  console.log('calledGet', calledGet);

  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  console.log('decodedGet', decodedGet);

  renderNaijas();

  $("#loader").hide();
});

jQuery("#naijaBody").on("click", ".voteBtn", async function(event){
  const value = $(this).siblings('input').val();
  const dataIndex = event.target.id;
  const foundIndex = naijaArray.findIndex(naija => naija.index == dataIndex);
  naijaArray[foundIndex].votes += parseInt(value, 10);
  renderNaijas();
});

$('#registerBtn').click(async function(){
  var name = ($('#regName').val()),
      url = ($('#regUrl').val());

  naijaArray.push({
    creatorName: name,
    naijaUrl: url,
    index: naijaArray.length+1,
    votes: 0
  })
  renderNaijas();
});






