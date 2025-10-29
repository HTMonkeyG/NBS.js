declare namespace NBSRW {
  export class NBSHeader {
    static deserialize(buffer: DataView, cursor: number): {
      value: NBSHeader,
      length: number
    };

    // String properties

    /**
     * The name of the song.
     */
    songName: string;
    /**
     * The author of the song.
     */
    author: string;
    /**
     * The original author of the song.
     */
    orignalAuthor: string;
    /**
     * The description of the song.
     */
    description: string;
    /**
     * If the song has been imported from a .mid or .schematic file, that file
     * name is stored here (only the name of the file, not the path).
     */
    midiFile: string;

    // Int32 properties

    /**
     * Amount of minutes spent on the project.
     */
    minutes: number;
    /**
     * Amount of times the user has left-clicked.
     */
    leftClick: number;
    /**
     * Amount of times the user has right-clicked.
     */
    rightClick: number;
    /**
     * Amount of times the user has added a note block.
     */
    noteAdded: number;
    /**
     * The amount of times the user have removed a note block.
     */
    noteRemoved: number;

    // Int16 properties

    /**
     * The first 2 bytes are always zero. In the old NBS format, this used to be
     * song length, which can never be zero.
     * 
     * This is how you can check whether a .nbs file is using the new format.
     */
    songLengthOld: number;
    /**
     * The length of the song, measured in ticks. Divide this by the tempo to get
     * the length of the song in seconds. Note Block Studio doesn't really care
     * about this value, the song size is calculated in the second part.
     * 
     * (Note: this was re-added in NBS version 3)
     */
    songLength: number;
    /**
     * The last layer with at least one note block in it, or the last layer that
     * has had its name, volume or stereo changed.
     */
    layerCtr: number;
    /**
     * The tempo of the song multiplied by 100 (for example, 1225 instead of 12.25).
     * Measured in ticks per second.
     */
    tempo: number;
    /**
     * Determines which part of the song (in ticks) it loops back to.
     */
    loopStartTick: number;

    // Int8 properties

    /**
     * The version of the new NBS format.
     */
    version: number;
    /**
     * Amount of default instruments when the song was saved. This is needed to
     * determine at what index custom instruments start.
     */
    instumentCtr: number;
    /**
     * Whether auto-saving has been enabled (0 or 1). As of NBS version 4 this
     * value is still saved to the file, but no longer used in the program.
     */
    autoSave: number;
    /**
     * The amount of minutes between each auto-save (if it has been enabled) (1-60).
     * As of NBS version 4 this value is still saved to the file, but no longer used
     * in the program.
     */
    autoSaveDuration: number;
    /**
     * The time signature of the song. If this is 3, then the signature is 3/4.
     * 
     * Default is 4. This value ranges from 2-8.
     */
    timeSign: number;
    /**
     * Whether looping is on or off. (0 = off, 1 = on)
     */
    loop: number;
    /**
     * 0 = infinite. Other values mean the amount of times the song loops.
     */
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
     * Whether the piano should automatically press keys with this instrument when
     * the marker passes them (0 or 1).
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

    /**
     * Calculate the time to the beginning of the song in seconds.
     * @param {number} tick - The number of NBS ticks from the beginning of the song.
     * @returns {number}
     */
    getTimeSecFor(tick: number): number;

    /**
     * Calculate the time to the beginning of the song in gameticks.
     * @param {number} tick - The number of NBS ticks from the beginning of the song.
     * @returns {number}
     */
    getTimeGtFor(tick: number): number;
  }

  /**
   * Vanilla instrument sound events of Minecraft Java.
   */
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
  };

  /**
   * Vanilla instrument sound events of Minecraft Bedrock.
   */
  const INSTBE: {
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