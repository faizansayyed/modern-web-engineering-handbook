const debounce = (func,delay) =>{
    let timer;

  return function(...args){
    clearTimeout(timer);

    timer = setTimeout(() =>{
      func.apply(this,args)
    },delay)
  }
}

function search(query) {
  console.log("API call:", query);
}

const debouncedSearch = debounce(search, 500);

debouncedSearch("r");
debouncedSearch("re");
debouncedSearch("rea");
debouncedSearch("react");
