//bonus: EnumPrinters(PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS, NULL, 1);

let i = 0;
while(displayDevice = EnumDisplayDevices(NULL, i, NULL)) { //if you pass EDD_GET_DEVICE_INTERFACE_NAME as the third parameter, DeviceID will hold the device interface name for GUID_DEVINTERFACE_MONITOR
    print(`Display ${i}`);
    print(displayDevice);
    print(`Monitor ${i}`);
    print(EnumDisplayDevices(displayDevice.DeviceName, 0));
    i++;
}