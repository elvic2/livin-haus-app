export const pendingApartments = [
  '404', '406', '407', 
  '705', '706', 
  '801', 
  '904', '906', '907', '908'
];

// All valid apartments by floor
export const buildingStructure = {
  2: ['201', '202', '203', '204', '205', '206', '207', '208'],
  3: ['301', '302'],
  4: ['401', '402', '403', '404', '405', '406', '407', '408'],
  5: ['501', '502', '503', '504', '505', '506', '507', '508'],
  6: ['601', '602', '603', '604', '605', '606', '607', '608'],
  7: ['701', '702', '703', '704', '705', '706', '707', '708'],
  8: ['801', '802', '803', '804', '805', '806', '807', '808'],
  9: ['901', '902', '903', '904', '905', '906', '907', '908'],
  10: ['1001', '1002', '1003', '1004']
};

// Generate reported apartments (all except pending)
export const reportedApartments = [];
Object.values(buildingStructure).forEach(floorApts => {
  floorApts.forEach(apt => {
    if (!pendingApartments.includes(apt)) {
      reportedApartments.push(apt);
    }
  });
});

export function isPending(apt) {
  return pendingApartments.includes(apt);
}

export function isReported(apt) {
  return reportedApartments.includes(apt);
}
