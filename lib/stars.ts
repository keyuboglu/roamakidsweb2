export const STAR_COLUMNS=1000;
export const STAR_ROWS=1000;
export const STAR_CAPACITY=STAR_COLUMNS*STAR_ROWS;
export const STAR_SPACING=8;
export const STAR_WORLD_SIZE=STAR_COLUMNS*STAR_SPACING;
export const STAR_TILE_SIZE=50;
export const STAR_TILE_COUNT=STAR_COLUMNS/STAR_TILE_SIZE;
export const STAR_NAME_MAX_LENGTH=40;

export type PublicStar={starNumber:number;starName:string|null};
export type StarTile={tileX:number;tileY:number;count:number};
export type StarOverview={capacity:number;count:number;tiles:StarTile[];recent:PublicStar[]};

export function isStarNumber(value:number) {
  return Number.isInteger(value)&&value>=1&&value<=STAR_CAPACITY;
}

export function starPosition(number:number) {
  const index=number-1;
  let seed=Math.imul(number^(number>>>16),0x45d9f3b);
  seed=Math.imul(seed^(seed>>>16),0x45d9f3b);
  seed=(seed^(seed>>>16))>>>0;
  return {
    x:(index%STAR_COLUMNS)*STAR_SPACING+2+((seed>>>8)&1)*4,
    y:Math.floor(index/STAR_COLUMNS)*STAR_SPACING+2+((seed>>>16)&1)*4,
  };
}

export function starTile(number:number) {
  return {tileX:Math.floor(((number-1)%STAR_COLUMNS)/STAR_TILE_SIZE),tileY:Math.floor((number-1)/STAR_COLUMNS/STAR_TILE_SIZE)};
}

export function starTileRanges(tileX:number,tileY:number) {
  return Array.from({length:STAR_TILE_SIZE},(_,row)=>{
    const first=(tileY*STAR_TILE_SIZE+row)*STAR_COLUMNS+tileX*STAR_TILE_SIZE+1;
    return {starNumber:{gte:first,lte:first+STAR_TILE_SIZE-1}};
  });
}

export function buildStarPixels() {
  const width=STAR_COLUMNS*2;
  const pixels=new Uint8ClampedArray(width*STAR_ROWS*2*4);
  for(let number=1;number<=STAR_CAPACITY;number++){
    const {x,y}=starPosition(number);
    const offset=(Math.floor(y/4)*width+Math.floor(x/4))*4;
    pixels[offset]=164;
    pixels[offset+1]=185;
    pixels[offset+2]=210;
    pixels[offset+3]=110+(number%4)*25;
  }
  return pixels;
}
