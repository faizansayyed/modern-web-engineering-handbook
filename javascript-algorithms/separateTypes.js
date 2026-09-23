const separateTypes = (arr) =>{
    const nums = arr.filter(d => typeof d === 'number')
    const strs  = arr.filter(d => typeof d === 'string');

    return {nums, strs}
}

const arr = [10, "hello", 20, "world", 5, "react"];

console.log(separateTypes(arr));
