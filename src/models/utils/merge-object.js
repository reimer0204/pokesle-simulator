function mergeObject(object1, object2) {
  return _mergeObject(object1, object2);
}

function _mergeObject(object1, object2) {

  if (object1 === undefined) throw 'Unexpected error';
  if (object2 === undefined) return object1;

  let object1Type = object1?.constructor?.name
  let object2Type = object2?.constructor?.name

  if (object1Type == 'Object') {
    if (object2Type == 'Object') {
      for(let key of Object.keys(object1)) {
        object1[key] = _mergeObject(object1[key], object2[key])
      }
    }
    return object1;

  } else {
    return object2;
  }
}

export default mergeObject;