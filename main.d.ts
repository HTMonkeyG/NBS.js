declare namespace NBSRW {
  export class NBSHeader {
    static deserialize(buffer: DataView, cursor: number): {
      value: NBSHeader,
      length: number
    };

    // String properties
    songName: string;
    author: string;
    orignalAuthor: string;
    description: string;
    midiFile: string;

    // Int32 properties
    minutes: number;
    leftClick: number;
    rightClick: number;
    noteAdded: number;
    noteRemoved: number;

    // Int16 properties
    songLengthOld: number;
    songLength: number;
    layerCtr: number;
    tempo: number;
    loopStartTick: number;

    // Int8 properties
    version: number;
    instumentCtr: number;
    autoSave: number;
    autoSaveDuration: number;
    timeSign: number;
    loop: number;
    maxLoop: number;

    constructor();
  }

  export class NBSNote {
    static deserialize(buffer: DataView, cursor: number): NBSNote;

    /**
     * The instrument of the note block.
     * This is 0-15, or higher if the song uses custom instruments.
     */
    instrument: number;
    /**
     * The key of the note block, from 0-87, where 0 is A0 and 87 is C8.
     * 33-57 is within the 2-octave limit.
     */
    key: number;
    /**
     * The velocity/volume of the note block, from 0% to 100%.
     */
    velocity: number;
    /**
     * The stereo position of the note block, from 0-200.
     * 0 is 2 blocks right, 100 is center, 200 is 2 blocks left.
     */
    panning: number;
    /**
     * The fine pitch of the note block, from -32,768 to 32,767 cents
     * (but the max in Note Block Studio is limited to -1200 and +1200).
     * 0 is no fine-tuning, ±100 cents is a single semitone difference.
     */
    pitch: number;
    /**
     * Layer of this note block.
     */
    layer: number;

    constructor();
  }

  export class NBSEffectiveTick {
    static deserialize(buffer: DataView, cursor: number): {
      value: NBSEffectiveTick,
      length: number
    };

    /**
     * Ticks to the beginning of the song.
     */
    tick: number;
    /**
     * Notes in current tick.
     */
    notes: NBSNote[];

    constructor();
  }

  export class NBSLayer {
    static deserialize(buffer: DataView, cursor: number): {
      value: NBSLayer,
      length: number
    };

    /**
     * The name of the layer.
     */
    name: string;
    /**
     * Whether or not this layer has been marked as locked.
     * 1 = locked.
     */
    lock: number;
    /** 
     * The volume of the layer (percentage).
     * Ranges from 0-100.
     */
    volume: number;
    /** 
     * How much this layer is panned to the left/right.
     * 0 is 2 blocks right, 100 is center, 200 is 2 blocks left.
     */
    stereo: number;

    constructor();
  }

  export class NBSCustomInstrument {
    static deserialize(buffer: DataView, cursor: number): {
      value: NBSCustomInstrument,
      length: number
    };
    /**
     * The name of the instrument.
     */
    name: string;
    /**
     * The sound file of the instrument (relative path from the /Sounds directory).
     */
    path: string;
    /**
     * The key of the sound file.
     * Just like the note blocks, this ranges from 0-87.
     * Default is 45 (F#4).
     */
    key: number;
    /**
     * Whether the piano should automatically press keys with this instrument when the marker passes them (0 or 1).
     */
    pressPianoKey: number;
  }


  export class NBSPlayerIterator {
    readonly nbs: NBS;
    readonly tick: number;
    readonly tickIndex: number;
    readonly maxTick: number;

    constructor(nbs: NBS);

    next(): {
      value: NBSEffectiveTick,
      done: boolean
    };
    [Symbol.iterator](): NBSPlayerIterator;
  }

  export class NBS {
    /**
     * Read NBS file.
     * @param {ArrayBuffer} buffer - Input data.
     */
    static deserialize(buffer: ArrayBuffer): NBS;

    /**
     * Create an iterator in ticks.
     * @param {NBS} nbs 
     */
    static createPlayer(nbs: NBS): NBSPlayerIterator

    header: NBSHeader;
    effectiveTicks: NBSEffectiveTick[];
    layers: NBSLayer[];
    customInstuments: NBSCustomInstrument[];

    constructor();
  }

  const INSTJE: {
    0: "block.note_block.harp",
    1: "block.note_block.bass",
    2: "block.note_block.basedrum",
    3: "block.note_block.snare",
    4: "block.note_block.hat",
    5: "block.note_block.guitar",
    6: "block.note_block.flute",
    7: "block.note_block.bell",
    8: "block.note_block.chime",
    9: "block.note_block.xylophone",
    10: "block.note_block.iron_xylophone",
    11: "block.note_block.cow_bell",
    12: "block.note_block.didgeridoo",
    13: "block.note_block.bit",
    14: "block.note_block.banjo",
    15: "block.note_block.pling"
  }, INSTBE: {
    0: "note.harp",
    1: "note.bass",
    2: "note.bd",
    3: "note.snare",
    4: "note.hat",
    5: "note.guitar",
    6: "note.flute",
    7: "note.bell",
    8: "note.chime",
    9: "note.xylophone",
    10: "note.iron_xylophone",
    11: "note.cow_bell",
    12: "note.didgeridoo",
    13: "note.bit",
    14: "note.banjo",
    15: "note.pling"
  };
}

export = NBSRW;