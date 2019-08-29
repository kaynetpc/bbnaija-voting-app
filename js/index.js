const contractSource = `
contract NaijaVote =

  record naija =
    { naijaAddress   : address,
      creatorAddress : address,
      url            : string,
      name           : string,
      voteCount      : int }

  record state =
    { naijas      : map(int, naija),
      naijasLength : int }

  entrypoint init() =
    { naijas = {},
      naijasLength = 0 }

  entrypoint get_naija(index : int) : naija =
  	switch(Map.lookup(index, state.naijas))
	    None    => abort("There was no naija with this index registered.")
	    Some(x) => x

  stateful entrypoint register_naija(url' : string, name' : string) =
    let naija = { naijaAddress = ak_2YzjjyM5XDSpkZaffv6RWcn6iceSPeL79K3knyKH7UhhsvwRnq, creatorAddress = Call.caller, url = url', name = name', voteCount = 0}
    let index = get_naijas_length() + 1
    put(state{ naijas[index] = naija, naijasLength = index })

  entrypoint get_naijas_length() : int =
    state.naijasLength

  stateful entrypoint vote_naija(index : int) =
    let naija = get_naija(index)
    Chain.spend(naija.naijaAddress, Call.value)
    let updatedVoteCount = naija.voteCount + Call.value
    let updateNaijas = state.naijas{ [index].voteCount = updatedVoteCount }
    put(state{ naijas = updateNaijas })`;

const contractAddress = 'ct_gWaavjGUmfEhT6pPUDhFCAceDTDZPHB7WkQR7GbxWrfxD9P7d';    

var client = null;
var contractInstance = null;
var naijaArray = [];
var naijasLength = 0;

function renderNaijas() {
  naijaArray = naijaArray.sort((a, b) => b.votes - a.votes);
  let template = $('#template').html();
  Mustache.parse(template);
  let rendered = Mustache.render(template, {naijaArray});
  $('#naijaBody').html(rendered);
}

window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource, {contractAddress});

  naijasLength = (await contractInstance.methods.get_naijas_length()).decodedResult;

  for (let i = 1; i <= naijasLength; i++) {
    const naija = (await contractInstance.methods.get_naija(i)).decodedResult;

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
      naijaIndex = event.target.id;

  await contractInstance.methods.vote_naija(naijaIndex, { amount: value }).catch(function(error) {
    alert(error)
  });

  const foundIndex = naijaArray.findIndex(naija => naija.index == naijaIndex);


  naijaArray[foundIndex].votes += parseInt(value, 10);

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

/*
jQuery("#backtotop").click(function () {
  jQuery("body,html").animate({
      scrollTop: 0
  }, 600);
});
jQuery(window).scroll(function () {
  if (jQuery(window).scrollTop() > 150) {
      jQuery("#backtotop").addClass("visible");
  } else {
      jQuery("#backtotop").removeClass("visible");
  }
});

*/