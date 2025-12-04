// Quick test to see what tokens we get
const sentence = "Diese Technik findet Anwendung";
console.log("Testing:", sentence);
console.log("\nExpected detection:");
console.log("- Verb: findet (lemma: finden)");
console.log("- Noun: Anwendung"); 
console.log("- Construction: Anwendung finden = angewendet werden");
console.log("\nIf detector runs, should match verb 'finden' with noun 'Anwendung'");
