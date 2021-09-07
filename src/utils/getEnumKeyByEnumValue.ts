export default function getEnumKeyByEnumValue<
  T extends { [index: string]: string },
>(myEnum: T, enumValue: string): keyof T {
  let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
  if (!keys.length) throw Error(`Enum does not contiain value: ${enumValue}`);
  return keys[0];
}
