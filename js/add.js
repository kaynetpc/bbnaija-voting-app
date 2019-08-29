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

const contractAddress = 'ct_2UEyMiQiKBKgwWwHtkeqaZkUTJiw1GGVT9kTvLqW2BZsn75ZqC';    

var client = null;
var contractInstance = null;
var naijaArray = [];

window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource, {contractAddress});

  $("#loader").hide();
});

$('#registerBtn').click(async function(){
  $("#loader").show();

  const name = ($('#regName').val()),
        url = ($('#regUrl').val());
        
  await contractInstance.methods.register_naija(url, name);

  naijaArray.push({
    naijaName: name,
    naijaUrl: url,
    index: naijaArray.length+1,
    votes: 0,
  })

  $("#naijaForm")[0].reset();
  $("#loader").hide();
});