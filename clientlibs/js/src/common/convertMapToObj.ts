export default function convertMapToObj(sourceMap: Map<string, any>) {
  if (sourceMap instanceof Map) {
    const obj = Object.fromEntries(sourceMap);
    // const obj = {};
    // for (const prop of sourceMap) {
    //   obj[prop[0]] = prop[1];
    // }
    return obj;
  } else {
    throw new Error('Invalid input type');
  }
}
