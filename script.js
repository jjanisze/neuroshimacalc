String.prototype.reduceWhiteSpace = function() {
    return this.replace(/\s+/g, ' ');
};

String.prototype.stripSpaces = function() {
    // Strip trailing and leading spaces
    let result = /^ *(?<token>[\w ąćęłńóśźż.\+-]*[\wąćęłńóśźż.\+-]) *$/.exec(this);
    if( result === null ) {
        console.error(`Unexpected strip space rexegp failure in ${this}`);
    }
    return result.groups.token;
};

Array.prototype.getRandom = function() {
    return this[Math.floor( Math.random() * this.length ) ];
};

const urls = [
    'attribute.json',
    'specialization.json',
    'skill.json',
    'class.json',
    'origin.json',
    'perk.json',
];

// Global list of rulesets
var rulesets = [];

// Global ID to Identifiable lookup table
var IDLookup = {};

// Global functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Base database classes
class Identifiable {
    constructor(data) {
        this.data = data;
        
        // Validate ID
        var IDstr = String(this.ID).trim().toUpperCase();
        if( IDstr.length < 3 ) {
            throw new Error("IDs cannot be shorter than 3 characters");
        }
        if( IDstr != this.ID ) {
            throw new Error("Invalid ID '"+this.Name+"'");
        }
        if (this.ID in IDLookup) {
            throw new Error("Duplicate ID '%s' found", IDstr);
        }
        IDLookup[this.ID] = this;

        // Validate Ruleset
        var Rulesetstr = String(this.Ruleset).trim();
        if( Rulesetstr.length < 3 ) {
            throw new Error("Ruleset names can't be shorter than 4 for "+this.ID);
        }
        if( Rulesetstr != this.Ruleset ) {
            throw new Error("Extra whitespace in Ruleset name for "+this.ID);
        }
        if( ! rulesets.includes(this.Ruleset) ) {
            rulesets.push(this.Ruleset);
        }
    }
    get ID() { return this.data.ID; }
    get Name() { return this.data.Name; }
    get Ruleset() { return this.data.Ruleset; }
}

class Describable extends Identifiable {
    constructor(data) {
        super(data);
    }
    get Description() { return this.data.Description; }
}

const Gender = {
    MEZCZYZNA:Symbol("Mężczyzna"),
    KOBIETA:Symbol("Kobieta")
};

// Attributes
var attributes = [];
class Attribute extends Describable {
    constructor(data) {
        super(data);
    }
    
}
function parseAttributes(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var attribute = new Attribute(item);
        attributes.push(attribute);
    });
    console.log("Parsed %d attributes", attributes.length);
}
function constructAttributeHTML() {
    for (var i=0; i<attributes.length; ++i) {
        var atr = attributes[i];
        var html = '<div class="attribute-instance"><h3>';
        html += atr.Name;
        html += '</h3><input type="number" id="'+atr.ID+'" min="0" max="30" /></div>' ;
        $('#attributes-container').append(html);
    }
}


// Specializations
var specializations = [];
class Specialization extends Describable {
    constructor(data) {
        super(data);
    }
}
function parseSpecializations(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var specialization = new Specialization(item);
        specializations.push(specialization);
    });
    console.log("Parsed %d specializations", attributes.length);
}
function constructSpecializationHTML() {
    for (var i=0; i<specializations.length; ++i) {
        var spe = specializations[i];
        var html = '<option value="'+spe.Name+'">'+spe.Name+'</option>';
        $('#specialization-selector').append(html);
    }
}

// Skills
var skills = [];
var skillsTree = {}; // {ATR_ID:{GROUPNAME:[skill,skill]}
class Skill extends Describable {
    constructor(data) {
        super(data);

        
        if ( this.data.Attribute ) {
            // Validate and cross-reference Attribute
            if( this.data.Attribute in IDLookup ) {
                var attr = IDLookup[this.data.Attribute];
                if( ! attr instanceof Attribute ) {
                    throw Error("For Skill '"+this.Name+"', base Attribute ID '"+this.data.Attribute+"' is not an Attribute");
                } else {
                    this.attribute = attr;
                }
            } else {
                throw Error("Cannot find ID '"+this.data.Attribute+"'");
            }
        } else {
            // No associated attribute
            this.attribute = null;
        }
        

        // Validate and cross-reference Specialization
        this.specializations = [];
        if( this.data.Specialization != null ) {
            let chunks = this.data.Specialization.split(",");
            for (let i=0; i<chunks.length; ++i) {
                let text = chunks[i].stripSpaces();
                if( text in IDLookup ) {
                    var spec = IDLookup[this.data.Specialization];
                    if( ! spec instanceof Specialization ) {
                        throw Error("For Skill '"+this.Name+"', Specialization ID '"+this.data.Specialization+"' is not a Specialization");
                    } else {
                        this.specializations.push(spec);
                    }
                } else {
                    console.error(`Not found specialization %{}`)
                }
            }
        }
    }
    get Attribute() { return this.attribute; } // Nullable!
    get Specialization() { return this.data.specialization; }
    get GroupName() { return this.data.GroupName; }
}
function parseSkills(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var skill = new Skill(item);
        let sgn = skill.GroupName;
        
        skills.push(skill);

        // Create skills tree
        if( skill.Attribute != null ) {
            let saID = skill.Attribute.ID;
            if( !( saID in skillsTree )) {
                skillsTree[saID] = {};
            }
            let skillgroups = skillsTree[saID];
            if( !( sgn in skillgroups )) {
                skillgroups[sgn] = [];
            }
            skillgroups[sgn].push(skill);
        }
    });
    console.log("Parsed %d skills", skills.length);
}
function constructSkillHTML() {
    html = "";
    for (const[attr, grpdict] of Object.entries(skillsTree)) {
        html += '<div class="skill-attribute-group">';
        html += '<h2>' + IDLookup[attr].Name + '</h2>';
        for (const[grpname, grparr] of Object.entries(grpdict)) {
            html += '<div class="skill-sub-group">';
            html += '<h3>' + grpname + '</h3>';
            for(let i=0; i<grparr.length; ++i) {
                let skl = grparr[i];
                html += '<div class="skill-item"><h4>'+skl.Name+'</h4>'
                html += '<input type="number" id="'+skl.ID+'" min="0" max="30"/></div>'
                
            }
            html += '</div>';
        }
        html += '</div>';
    }
    $('#skills-container').append(html);
}
function highlightSpecializations(spec) {
    
}

// Classes
var classes = [];
class Class extends Describable {
    constructor(data) {
        super(data);
    }
    get FlavorText() { return this.data["Flavor text"]; }
}
function parseClasses(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var cls = new Class(item);
        classes.push(cls);
    });
    console.log("Parsed %d classes", classes.length);
}


const EffectorType = {
    BONUS_ATRYBUT:Symbol("bonus atrybut"),
    BONUS_ATRYBUT_WYBRANY:Symbol("bonus atrybut wybrany"),
}

class Effector {
    constructor(type, property, amount) {
        this.type = type;
        this.property = property;
        this.amount = amount;
    }
}


class Origin extends Describable {
    constructor(data) {
        super(data);
        this.bonuses = this.parseBonus(this.data.Bonus);
    }

    parseBonus(text) {
        if( text == null ) {
            return [];
        }

        text = text.replace(":" ," ");
        text = text.reduceWhiteSpace().stripSpaces();
        let chunks = text.split(" ");
        if( chunks.length != 2 ) {
            console.error(`Error parsing origin bonus ${text} - expected 2 parts`);
            return [];
        }
        
        Origin.buildLookup();
        for( var key in Origin.table ) {
            if(chunks[0] == key) {
                let tuple = Origin.table[key];
                return [new Effector(tuple[0], tuple[1], 1)];
            }
        }
        console.error(`Unknown origin bonus ${chunks[0]}`);
        return [];
    }

    static table = null;
    static buildLookup() {
        if( Origin.table != null ) {
            return;
        }
        Origin.table = {};
        for (let ai=0; ai<attributes.length; ++ai) {
            let atr = attributes[ai];
            let str = `${atr.ID}_BONUS`;
            Origin.table[str] = [EffectorType.BONUS_ATRYBUT, atr] ;
        }
        Origin.table["ATR_ANY_BONUS"] = [EffectorType.BONUS_ATRYBUT_WYBRANY, null];
    }
    
}

var origins = [];
function parseOrigin(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var org = new Origin(item);
        origins.push(org);
    });
    console.log("Parsed %d origins", origins.length);
}

// Parsing regexps
//numericReq = /^.+\d+\+$/;

// Simple numeric req
const simpleNumeric = /^ *(?<token>[\w ąćęłńóśźż.]*) (?<value>\d+)(?<operator>[\+-]) *$/;

const Operators = {
    IS:Symbol("=="),
    GOR:Symbol(">="),
    LOR:Symbol("<="),
};

// For different requirement types, 
const RequirementType = {
    // null
    CECHA_STARTOWA:Symbol("cecha startowa"),
    
    // origin object
    POCHODZENIE:Symbol("pochodzenie"),
    
    // class object
    PROFESJA:Symbol("profesja"),

    // attribute object
    ATRYBUT:Symbol("atrybut"),

    // skill object
    UMIEJETNOSC:Symbol("umiejętność"),

    // specialization object
    SPECJALIZACJA:Symbol("specjalizacja"),

    // perk object
    SZTUCZKA:Symbol("sztuczka"),

    // group name string
    UMIEJETNOSC_Z_GRUPY:Symbol("umiejętność z grupy"),
    
    // group name string
    WSZYSTKIE_UMIEJETNOSCI_Z_GRUPY:Symbol("wszystkie umiejętności z grupy"),

    // gender enum
    PLEC:Symbol("płeć"),

    // descrtiption string
    OTHER:Symbol("other"),

    // null
    BRAK:Symbol("brak"),
}

class PerkRequirementAtom {
    constructor(text) {
        this.complete = false;
        
        // Nullable
        this.type = RequirementType.BRAK; // LVAL
        this.selector = null;   // LVAL selector
        this.value = null;      // RVAL
        

        // Strip potential :
        text = text.replace(":", " ");
        text = text.toLowerCase();
        text = text.stripSpaces().reduceWhiteSpace();
        

        // Attempt to parse as numeric field, ie "pistolety 3+"
        let simplenumeric = simpleNumeric.exec(text);
        if ( simplenumeric !== null ) {
            this.value = simplenumeric.groups.value;
            this.complete = this.parseToken(simplenumeric.groups.token.stripSpaces());
            return;
        } else {
            // Pochodzenie
            if( this.tryParseNamedArray(text, RequirementType.POCHODZENIE, origins) ){
                return;
            }

            // Profesja
            if( this.tryParseNamedArray(text, RequirementType.PROFESJA, classes) ){
                return;
            }

            // Specjalizacja
            if( this.tryParseNamedArray(text, RequirementType.SPECJALIZACJA, specializations) ){
                return;
            }

            // Sztuczka
            // Note: prerequisite perk must be defined up the list!
            if( this.tryParseNamedArray(text, RequirementType.SZTUCZKA, perks) ){
                return;
            }

            // Płeć
            if( text.startsWith(RequirementType.PLEC.description) ) {
                text = text.replace(RequirementType.PLEC.description, "").stripSpaces();
                switch(text) {
                    case Gender.KOBIETA.description.toLowerCase():
                        this.value = Gender.KOBIETA;
                        return;
                    case Gender.MEZCZYZNA.description.toLowerCase():
                        this.value = Gender.MEZCZYZNA;
                        return;
                    default:
                        console.error(`Unknown gender ${text}`);
                }
            }

            // Brak
            if( text == RequirementType.BRAK.description ) {
                this.type = RequirementType.BRAK;
                return;
            }

            // Cecha startowa
            if( text == RequirementType.CECHA_STARTOWA.description ) {
                this.type = RequirementType.CECHA_STARTOWA;
                return;
            }

            // Number-less skill 
            // Number-less attribute
            this.complete = this.parseToken(text);
            if( this.complete ) {
                return;
            }
            
            // Assuming it has to be other
            this.type = RequirementType.OTHER;
            this.value = text;
            console.log(`Adding perk as other: ${text}`)
        }

    }

    tryParseNamedArray(text, req, arr) {
        let reqd = req.description;
        if( text.startsWith(reqd)) {
            text = text.replace(reqd, "").stripSpaces();
            this.type = req;
            for( let i=0; i<arr.length; ++i) {
                let item = arr[i];
                if( item.Name.toLowerCase() == text ) {
                    this.value = item;
                    this.complete = true;
                    return true;
                }
            }
            console.error(`Did not find ${reqd} ${text}`);
            return false;
        }
        return false;
    }

    parseToken(token) {
        // Try attribute
        for (var i=0; i<attributes.length; ++i) {
            var atr = attributes[i];
            let name = atr.Name.toLowerCase();
            if( token == name ) {
                this.type = RequirementType.ATRYBUT;
                this.required = atr;
                return true;
            }
        }

        // Try skill
        for (var i=0; i<skills.length; ++i) {
            var skl = skills[i];
            let name = skl.Name.toLowerCase();
            if( token == name ) {
                this.type = RequirementType.UMIEJETNOSC;
                this.required = skl;
                return true;
            }
        }

        // Try "umiejętność z grupy" and "wszystkie umiejętności z grupy"
        if(
            !this.parseGroupLogic(token, RequirementType.UMIEJETNOSC_Z_GRUPY) &&
            !this.parseGroupLogic(token, RequirementType.WSZYSTKIE_UMIEJETNOSCI_Z_GRUPY)
        ) {
            return false;
        } else {
            return true;
        }
    }

    parseGroupLogic(token, logicType) {
        if( token.startsWith(logicType.description) ) {
            token = token.replace(logicType.description, "");
            token = token.stripSpaces();
            this.type = logicType;
            for ( var id in skillsTree ) {
                let grp = skillsTree[id];
                for( var grpname in grp ) {
                    if( token == grpname.toLowerCase()) {
                        this.group = grp;
                        return true;
                    }
                }
            }
            console.error(`Unknown ${logicType.description} ${token}`);
        }
        return false;
    }

    parsePochodzenie(token) {

    }
}

// Perk requirements are all ANDed
// Are composed or 1 or more ORed perk requirement atoms
// ie. PerkRequirement: Mechanika lub Chirurgia 4+ -> Mechanika 4+ Atom OR Chirurgia 4+ Atom
// PerkRequirement: Mechanika 4+ -> Mechaika 4+ Atom
// A single 
class PerkRequirement {
    constructor(text) {
        text = text.toLowerCase();
        text = text.replace("albo", "lub");

        let atomstxt = text.split("lub");
        atomstxt.reverse();
        this.atoms = [];
        for( const atomtxt of atomstxt ) {
            let atom = new PerkRequirementAtom(atomtxt)
            this.atoms.push(atom);
        }
    }
}






var perks = [];
class Perk extends Describable {
    constructor(data) {
        super(data);
        this.RequirementsText = data.Requirements;
        let reqtext = this.data.Requirements.split(",");
        this.requirements = []
        for( const req of reqtext) {
            let requirement = new PerkRequirement(req);
            this.requirements.push(requirement);
        }
    }
}

function parsePerks(data) {
    Object.keys(data).forEach(function(key){
        var item = data[key];
        var perk = new Perk(item);
        perks.push(perk);
    });
    console.log("Parsed %d perks", perks.length);
}

// Character 


class Character {
    constructor() {
        this.attributes = {};
        for (const attribute of attributes) {
           this.attributes[attribute.ID] = 0;
        };
        this.skills = {};
        for (const skill of skills) {
            this.skills[skill.ID] = 0;
        };
        this.specialization = specializations[0];
        this.gender = Gender.MEZCZYZNA;
        this.firstName = "";
        this.lastName = "";
        this.age = 0;
    }

    randomize() {
        const that = this;
        // Attributes
        Object.keys(this.attributes).forEach(function(key){
            that.attributes[key] = getRandomInt(6, 18);
        });

        // Skills
        that.specialization = specializations.getRandom();
        Object.keys(this.skills).forEach(function(key){
            IDLookup[key].specializations
            that.skills[key] = getRandomInt(0, 6);
        });

        that.gender = ( Math.random() >= 0.4 ? Gender.MEZCZYZNA : Gender.KOBIETA );
        that.firstName = that.gender == Gender.MEZCZYZNA ? maleNames.getRandom() : femaleNames.getRandom();
        that.lastName = lastNames.getRandom();
        that.age = 10 + Math.floor( Math.random() * 70 );
        
    }
}

function loadChar(char) {
    merged = Object.assign({}, char.attributes, char.skills );
    Object.keys(merged).forEach(function(key){
        $('#'+key).val(merged[key]); 
    });
    $('#character-first-name').val(char.firstName);
    $('#character-last-name').val(char.lastName);
    $('#character-age').val(char.age);
    $('#specialization-selector').val(char.specialization.Name);
}

const promises = urls.map(url => fetch(url));


const maleNames = [ "Ash", "Blaze", "Crow", "Flint", "Gunner", "Hawk", "Hunter", "Jericho", "Knox", "Raven", "Reaper", "Scout", "Stone", "Talon", "Wolf", "Asher", "Caspian", "Elijah", "Ezekiel", "Jasper", "Kai", "Silas" ];
const femaleNames = [ "Ember", "Genesis", "Hope", "Iris", "Jade", "Juniper", "Nova", "Phoenix", "Rayne", "Willow", "Zephyr", "Anya", "Freya", "Luna", "Willow" ]; 
const lastNames = [ "Ashwood", "Blazeheart", "Crowfeather", "Dustrider", "Flintlock", "Gunhawk", "Ironsides", "Jericho", "Knoxblade", "Nightshade", "Phoenix", "Ravenguard", "Reaperstrike", "Shadowhunter", "Steelbreaker", "Stormsong", "Talonheart", "Wastelander", "Whisperwind", "Emberlight", "Genesis", "Hopewell", "Irismoon", "Jadehawk", "Juniperdawn", "Novastar", "Phoenixfire", "Raynecloud", "Willowwhisper", "Zephyrwing" ]

function getRandom() {

}


$(document).ready(function() {
    Promise.all(promises).then(responses => {
        // Process the responses here
        return Promise.all(responses.map(response => response.text()));
    }).then(data => {
        // data contains the content of all fetched files
        parseAttributes(JSON.parse(data[0]));
        parseSpecializations(JSON.parse(data[1]));
        parseSkills(JSON.parse(data[2]));
        parseClasses(JSON.parse(data[3]));
        parseOrigin(JSON.parse(data[4]));
        parsePerks(JSON.parse(data[5]));

        // Build HTML elements
        constructAttributeHTML();
        constructSpecializationHTML();
        constructSkillHTML();
        var char = new Character();
        char.randomize();
        loadChar(char);

    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
});